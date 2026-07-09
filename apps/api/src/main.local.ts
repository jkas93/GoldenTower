/**
 * Punto de entrada SOLO para desarrollo local.
 * En producción (Firebase), se usa main.ts con onRequest.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '..', '.env'),
];
envPaths.forEach((p) => dotenv.config({ path: p }));

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { setupSwagger } from './common/swagger/swagger.config';
import { initSentry } from './common/monitoring/sentry.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 4001;

  // Initialize Sentry for error tracking (only if SENTRY_DSN is set)
  const sentryEnabled = initSentry();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://goldentowerc.vercel.app',
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_PROD,
    ].filter(Boolean) as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global interceptors: Rate limiting + Audit logging
  app.useGlobalInterceptors(
    new RateLimitInterceptor(100, 60_000),
    new AuditLogInterceptor(),
  );

  // Setup Swagger documentation (only in dev/staging)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    setupSwagger(app);
    logger.log(`📚 Swagger docs disponible en: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 API corriendo en http://localhost:${port}`);
  logger.log(`✅ Rate limiting: 100 req/min por IP`);
  logger.log(`✅ Audit logging: Activado`);
  if (sentryEnabled) {
    logger.log(`✅ Sentry: Activado`);
  }
}

bootstrap();
