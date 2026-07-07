import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { FirestoreRepository } from '../common/repositories/firestore.repository';

@Injectable()
export class RRHHService {
  private employeesRepo: FirestoreRepository<any>;
  private usersRepo: FirestoreRepository<any>;
  private attendanceRepo: FirestoreRepository<any>;
  private incidentsRepo: FirestoreRepository<any>;

  constructor(
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) {
    const firestore = this.firebaseService.getFirestore();
    this.employeesRepo = new FirestoreRepository(firestore, 'employees');
    this.usersRepo = new FirestoreRepository(firestore, 'users');
    this.attendanceRepo = new FirestoreRepository(firestore, 'attendance');
    this.incidentsRepo = new FirestoreRepository(firestore, 'incidents');
  }

  private async validateUniqueFields(
    dni?: string,
    email?: string,
    excludeId?: string,
  ): Promise<void> {
    if (dni) {
      const duplicates = await this.employeesRepo.findByQuery((c) =>
        c.where('dni', '==', dni),
      );
      const filtered = duplicates.filter((doc) => doc.id !== excludeId);
      if (filtered.length > 0) {
        throw new ConflictException(
          `❌ DNI ${dni} ya está registrado por ${filtered[0].name || 'otro empleado'}`,
        );
      }
    }

    if (email) {
      const duplicates = await this.employeesRepo.findByQuery((c) =>
        c.where('email', '==', email),
      );
      const filtered = duplicates.filter((doc) => doc.id !== excludeId);
      if (filtered.length > 0) {
        throw new ConflictException(
          `❌ Email ${email} ya está registrado por ${filtered[0].name || 'otro empleado'}`,
        );
      }
    }
  }

  async createEmployee(data: any): Promise<string> {
    const auth = this.firebaseService.getAuth();

    await this.validateUniqueFields(data.dni, data.email);

    let uid = '';
    let isNewAuthUser = false;
    let resetLink = '';

    try {
      try {
        const tempPassword =
          data.password || Math.random().toString(36).slice(-8) + 'Aa1!';
        const userRecord = await auth.createUser({
          email: data.email,
          password: tempPassword,
          displayName: `${data.name} ${data.lastName || ''}`.trim(),
          disabled: false,
        });
        uid = userRecord.uid;
        isNewAuthUser = true;

        try {
          resetLink = await auth.generatePasswordResetLink(data.email);
        } catch (e) {
          console.warn('⚠️ No se pudo generar link de reset', e);
        }

        if (data.role) {
          await auth.setCustomUserClaims(uid, { role: data.role });
        }
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists') {
          const existingUser = await auth.getUserByEmail(data.email);
          uid = existingUser.uid;
        } else {
          throw authError;
        }
      }

      if (!uid) {
        throw new InternalServerErrorException(
          'No se pudo obtener el UID del usuario.',
        );
      }

      const existingEmployee = await this.employeesRepo.findOneOrNull(uid);
      if (existingEmployee) {
        throw new ConflictException(
          `❌ Conflicto de Integridad: Ya existe ficha para UID ${uid}`,
        );
      }

      const employeeData = {
        ...data,
        id: uid,
        roles: [data.role || 'EMPLEADO'],
        status: 'INVITADO',
      };
      delete employeeData.password;

      await this.employeesRepo.createWithId(uid, employeeData);

      console.log(
        `✅ Colaborador unificado creado (INVITADO): ${data.name} (UID: ${uid})`,
      );

      if (isNewAuthUser && resetLink) {
        try {
          await this.mailService.sendWelcomeEmail(
            data.email,
            data.name,
            data.role || 'Colaborador',
            resetLink,
          );
          console.log(`📧 Correo de bienvenida enviado a ${data.email}`);
        } catch (mailError) {
          console.error(`❌ Falló envío de correo a ${data.email}`, mailError);
        }
      }

      return uid;
    } catch (error) {
      if (isNewAuthUser && uid) {
        console.warn(
          `⚠️ ROLLBACK: Eliminando usuario Auth ${uid} tras fallo en proceso.`,
        );
        await auth
          .deleteUser(uid)
          .catch((e) => console.error('Error en rollback:', e));
      }
      throw error;
    }
  }

  async activateEmployee(id: string): Promise<void> {
    const employee = await this.employeesRepo.findOneOrNull(id);

    if (employee) {
      if (employee.status === 'INVITADO') {
        await this.employeesRepo.update(id, {
          status: 'ACTIVO',
          lastLogin: new Date().toISOString(),
          activatedAt: new Date().toISOString(),
        });
        console.log(`✅ Empleado activado (employees): ${id}`);
      } else {
        await this.employeesRepo.update(id, {
          lastLogin: new Date().toISOString(),
        });
      }
      return;
    }

    const user = await this.usersRepo.findOneOrNull(id);
    if (user) {
      if (user.status === 'INVITADO') {
        await this.usersRepo.update(id, {
          status: 'ACTIVO',
          activatedAt: new Date().toISOString(),
          firstLoginAt: new Date().toISOString(),
        });
        console.log(`✅ Usuario activado (users): ${id}`);
      }
      return;
    }

    console.log(
      `ℹ️ Usuario ${id} no requiere activación (sin ficha en employees/users)`,
    );
  }

  async findAllEmployees(
    limit: number = 50,
    startAfter?: string,
  ): Promise<{ employees: any[]; nextCursor?: string }> {
    const result = await this.employeesRepo.findAllPaginated(
      limit,
      'createdAt',
      'desc',
      startAfter,
    );
    return {
      employees: result.data,
      nextCursor: result.nextCursor,
    };
  }

  async updateEmployee(id: string, data: any): Promise<void> {
    await this.validateUniqueFields(data.dni, data.email, id);
    await this.employeesRepo.update(id, data);
    console.log(`✅ Empleado actualizado: ID ${id}`);
  }

  async findOneEmployee(id: string): Promise<any> {
    const userData = await this.usersRepo.findOneOrNull(id);
    const employeeData = await this.employeesRepo.findOneOrNull(id);

    if (!userData && !employeeData) {
      throw new Error('Employee not found');
    }

    return {
      ...(userData || {}),
      ...(employeeData || {}),
      id,
      hasLaborProfile: !!employeeData,
    };
  }

  async deleteEmployee(id: string): Promise<void> {
    const auth = this.firebaseService.getAuth();

    try {
      await auth.deleteUser(id);
      console.log(`🗑️ Usuario Auth eliminado: ${id}`);
    } catch (error) {
      console.warn(
        `⚠️ No se pudo eliminar usuario Auth ${id} (quizás ya no existe):`,
        error.message,
      );
    }

    await this.employeesRepo.delete(id);
    console.log(`🗑️ Ficha de empleado eliminada: ${id}`);
  }

  async recordAttendance(data: any): Promise<string> {
    const docId = `${data.employeeId}_${data.date}`;
    await this.attendanceRepo.createWithId(docId, data);
    return docId;
  }

  async getEmployeeAttendance(employeeId: string): Promise<any[]> {
    return this.attendanceRepo.findByQuery((c) =>
      c.where('employeeId', '==', employeeId),
    );
  }

  async createIncident(data: any): Promise<string> {
    return this.incidentsRepo.create(data);
  }

  async findAllIncidents(): Promise<any[]> {
    return this.incidentsRepo.findAll();
  }

  async updateIncidentStatus(id: string, status: string): Promise<void> {
    await this.incidentsRepo.update(id, { status });
  }

  async checkExistence(
    dni?: string,
    email?: string,
  ): Promise<{ exists: boolean; field?: string; name?: string; id?: string }> {
    if (dni) {
      const duplicates = await this.employeesRepo.findByQuery((c) =>
        c.where('dni', '==', dni),
      );
      if (duplicates.length > 0) {
        const data = duplicates[0];
        if (data.status === 'PENDIENTE') {
          await this.employeesRepo.update(data.id, { status: 'INVITADO' });
          console.log(`🔧 Auto-corregido status de ${data.name} a INVITADO`);
        }
        return {
          exists: true,
          field: 'DNI',
          name: data.name || 'Otro empleado',
          id: data.id,
        };
      }
    }

    if (email) {
      const duplicates = await this.employeesRepo.findByQuery((c) =>
        c.where('email', '==', email),
      );
      if (duplicates.length > 0) {
        const data = duplicates[0];
        if (data.status === 'PENDIENTE') {
          await this.employeesRepo.update(data.id, { status: 'INVITADO' });
        }
        return {
          exists: true,
          field: 'Email',
          name: data.name || 'Otro empleado',
          id: data.id,
        };
      }
    }

    return { exists: false };
  }
}
