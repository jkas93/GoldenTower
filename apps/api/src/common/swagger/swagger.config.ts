/**
 * Configuración de Swagger/OpenAPI para la API
 * 
 * Genera documentación automática de todos los endpoints en:
 * - Desarrollo: http://localhost:4001/api/docs
 * - Producción: https://api-ht5pvvxzha-uc.a.run.app/api/docs
 */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Golden Tower ERP API')
    .setDescription(
      'Documentación oficial de la API del sistema de gestión empresarial Golden Tower. ' +
      'Incluye endpoints para gestión de proyectos, RRHH, materiales, equipos, finanzas y más.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Golden Tower',
      'https://goldentowerc.vercel.app',
      'soporte@goldentower.pe',
    )
    .addServer('http://localhost:4001', 'Desarrollo Local')
    .addServer(
      'https://api-ht5pvvxzha-uc.a.run.app',
      'Producción (Firebase Functions)',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Firebase ID Token',
        description:
          'Token JWT obtenido desde Firebase Auth. Formato: `Bearer <ID_TOKEN>`',
        in: 'header',
      },
      'Firebase',
    )
    .addTag('Auth', 'Autenticación y gestión de usuarios')
    .addTag('RRHH', 'Recursos Humanos - Gestión de empleados')
    .addTag('Projects', 'Gestión de proyectos')
    .addTag('Activities', 'Actividades maestras del sistema')
    .addTag('Progress Logs', 'Registro de progreso de tareas')
    .addTag('Finance', 'Gestión financiera - compras y presupuestos')
    .addTag('Materials', 'Catálogo de materiales')
    .addTag('Material Requests', 'Solicitudes de materiales')
    .addTag('Equipment', 'Gestión de equipos y maquinaria')
    .addTag('Notifications', 'Sistema de notificaciones')
    .addTag('Stats', 'Estadísticas y BI')
    .addTag('Storage', 'Almacenamiento de archivos')
    .addTag('Health', 'Health checks y monitoreo')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_, methodKey) => methodKey,
    deepScanRoutes: true,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Golden Tower ERP API - Documentación',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar { display: none; }
      .swagger-ui .info .title { color: #D4AF37; }
    `,
  });
}
