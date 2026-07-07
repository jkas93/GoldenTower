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
envPaths.forEach(p => dotenv.config({ path: p }));

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 4001;

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://goldentowerc.vercel.app',
      'https://goldent-web.vercel.app',
      'https://golden.simplemarketing.website',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  logger.log(`🚀 API corriendo en http://localhost:${port}`);
}

bootstrap();
