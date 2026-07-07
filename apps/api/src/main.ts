import * as dotenv from 'dotenv';
import * as path from 'path';

// Carga explícita de variables de entorno (Robustez para Monorepo)
const envPaths = [
  path.join(__dirname, '..', '.env'),           // apps/api/.env
  path.join(__dirname, '..', '..', '..', '.env'), // Root .env (workspace)
];
envPaths.forEach(p => dotenv.config({ path: p }));

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';

const server = express();
let isAppInitialized = false;

async function bootstrap() {
  if (isAppInitialized) {
    return server;
  }
  
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Iniciando Golden Tower ERP API en Firebase Functions...');

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );

  // CORS: Configuración robusta unificada
  const allowedOrigins = [
    'https://goldentowerc.vercel.app',
    'https://goldent-web.vercel.app',
    'https://golden.simplemarketing.website',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalFilters(new AllExceptionsFilter());
  
  await app.init();
  isAppInitialized = true;
  logger.log(`✅ Aplicación NestJS inicializada para Firebase`);
  return server;
}

// Punto de entrada para Firebase Cloud Functions
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 10,
    invoker: 'public',
  },
  async (req, res) => {
    await bootstrap();
    server(req, res);
  }
);
