/**
 * Script de Migración: Unificación Usuario/Empleado
 * 
 * Este script migra todos los datos de la colección `users` a `employees`
 * usando el UID de Firebase Auth como identificador único.
 * 
 * Uso:
 *   npx tsx apps/api/src/scripts/migrate-users-to-employees.ts
 * 
 * IMPORTANTE: Ejecutar backup de la base de datos ANTES de correr este script.
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

interface MigrationReport {
  totalUsers: number;
  totalEmployees: number;
  migrated: number;
  merged: number;
  skipped: number;
  errors: string[];
}

async function initializeFirebase(): Promise<void> {
  if (admin.apps.length === 0) {
    const projectId = process.env.ADMIN_PROJECT_ID;
    const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Faltan variables de entorno de Firebase Admin');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

async function migrateUsersToEmployees(): Promise<MigrationReport> {
  const report: MigrationReport = {
    totalUsers: 0,
    totalEmployees: 0,
    migrated: 0,
    merged: 0,
    skipped: 0,
    errors: [],
  };

  await initializeFirebase();
  const db = admin.firestore();

  console.log('🔍 Analizando datos existentes...\n');

  // Get all users and employees
  const [usersSnap, employeesSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('employees').get(),
  ]);

  report.totalUsers = usersSnap.size;
  report.totalEmployees = employeesSnap.size;

  console.log(`📊 Encontrados:`);
  console.log(`   - Users: ${report.totalUsers}`);
  console.log(`   - Employees: ${report.totalEmployees}\n`);

  // Build index of employees by UID and email
  const employeesByUid = new Map<string, any>();
  const employeesByEmail = new Map<string, any>();

  employeesSnap.forEach((doc) => {
    const data = doc.data();
    employeesByUid.set(doc.id, { ...data, id: doc.id });
    if (data.email) {
      employeesByEmail.set(data.email.toLowerCase(), {
        ...data,
        id: doc.id,
      });
    }
  });

  const batch = db.batch();
  let batchCount = 0;

  for (const userDoc of usersSnap.docs) {
    try {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Case 1: Employee with same UID exists → merge
      if (employeesByUid.has(userId)) {
        const employee = employeesByUid.get(userId);
        const merged = {
          ...userData,
          ...employee,
          role: employee.role || userData.role,
          email: employee.email || userData.email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(db.collection('employees').doc(userId), merged, {
          merge: true,
        });
        batch.delete(userDoc.ref);
        report.merged++;
        batchCount += 2;

        console.log(`🔄 Merged: ${userData.email} (UID: ${userId})`);
      }
      // Case 2: Employee with same EMAIL exists (different ID) → migrate
      else if (
        userData.email &&
        employeesByEmail.has(userData.email.toLowerCase())
      ) {
        const employee = employeesByEmail.get(userData.email.toLowerCase());

        // Create new employee with correct UID
        const newEmployeeData = {
          ...employee,
          ...userData,
          id: userId,
          role: employee.role || userData.role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        delete (newEmployeeData as any).id; // Remove id field

        batch.set(
          db.collection('employees').doc(userId),
          newEmployeeData,
          { merge: true },
        );
        // Delete old employee doc
        batch.delete(db.collection('employees').doc(employee.id));
        batch.delete(userDoc.ref);
        report.migrated++;
        batchCount += 3;

        console.log(
          `📝 Migrated: ${userData.email} (Old ID: ${employee.id} → New UID: ${userId})`,
        );
      }
      // Case 3: No matching employee → create new employee from user data
      else {
        const newEmployeeData = {
          ...userData,
          id: userId,
          status: userData.status || 'ACTIVO',
          hasLaborProfile: false,
          createdAt:
            userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(db.collection('employees').doc(userId), newEmployeeData);
        batch.delete(userDoc.ref);
        report.migrated++;
        batchCount += 2;

        console.log(
          `➕ Created employee from user: ${userData.email} (UID: ${userId})`,
        );
      }

      // Commit batch every 400 operations (Firestore limit is 500)
      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
        console.log('✅ Batch committed\n');
      }
    } catch (error: any) {
      const errorMsg = `Error migrating user ${userDoc.id}: ${error.message}`;
      report.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  // Commit remaining operations
  if (batchCount > 0) {
    await batch.commit();
    console.log('✅ Final batch committed\n');
  }

  return report;
}

async function main(): Promise<void> {
  console.log('🚀 Iniciando migración Usuario → Empleado\n');
  console.log('⚠️  IMPORTANTE: Asegúrate de haber hecho backup de la BD.\n');

  const startTime = Date.now();

  try {
    const report = await migrateUsersToEmployees();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('📊 REPORTE DE MIGRACIÓN');
    console.log('='.repeat(50));
    console.log(`Total Users iniciales:    ${report.totalUsers}`);
    console.log(`Total Employees inicial:  ${report.totalEmployees}`);
    console.log(`Migrados (nuevos):        ${report.migrated}`);
    console.log(`Fusionados (existentes):  ${report.merged}`);
    console.log(`Omitidos:                 ${report.skipped}`);
    console.log(`Errores:                  ${report.errors.length}`);
    console.log(`Duración:                 ${duration}s`);
    console.log('='.repeat(50));

    if (report.errors.length > 0) {
      console.log('\n❌ ERRORES:');
      report.errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

export { migrateUsersToEmployees };
