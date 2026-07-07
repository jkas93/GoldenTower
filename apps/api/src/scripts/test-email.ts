import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Mock simple de ConfigService para evitar levantar todo el framework de Nest
class MockConfigService {
  get(key: string, defaultValue?: any) {
    // Mapear configuración desde variables de entorno reales
    if (key === 'SMTP_PORT') {
      return parseInt(process.env.SMTP_PORT || '587');
    }
    if (key === 'SMTP_SECURE') {
      return process.env.SMTP_SECURE === 'true';
    }
    return process.env[key] || defaultValue;
  }
}

async function run() {
  console.log('🚀 Iniciando simulación profesional de envío de correo...');
  console.log('ℹ️  Usando MailService real con configuración de entorno...');

  try {
    // 1. Instanciar servicio real con mock de configuración
    // Esto valida que la lógica interna del constructor de MailService es correcta
    const configService = new MockConfigService() as any;
    const mailService = new MailService(configService);

    // 2. Verificar conexión SMTP
    const isConnected = await mailService.verifyConnection();
    if (!isConnected) {
      throw new Error(
        'No se pudo establecer conexión con el servidor SMTP. Revise credenciales.',
      );
    }

    // 3. Simular envío de correo de bienvenida (Alta de Supervisor)
    const recipient = 'prueba@yopmail.com';
    console.log(`📧 Simulando alta de supervisor: ${recipient}`);

    await mailService.sendWelcomeEmail(
      recipient,
      'Supervisor de Prueba',
      'SUPERVISOR',
      'https://goldentower.pe/auth/action?mode=resetPassword&oobCode=SIMULATED_CODE',
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '✅ PRUEBA EXITOSA: El correo de bienvenida salió correctamente.',
    );
    console.log(
      '   Esto confirma que la funcionalidad de alta enviará correos reales.',
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ FALLÓ LA SIMULACIÓN:', error);
    process.exit(1);
  }
}

run();
