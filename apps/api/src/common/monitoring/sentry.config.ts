/**
 * Configuración de Sentry para Error Tracking y Performance Monitoring
 * 
 * Setup:
 * 1. Crear cuenta en https://sentry.io
 * 2. Crear proyecto "Node.js"
 * 3. Copiar el DSN
 * 4. Agregar a variables de entorno:
 *    SENTRY_DSN=https://your-key@sentry.io/project-id
 *    SENTRY_ENVIRONMENT=production|staging|development
 *    SENTRY_TRACES_SAMPLE_RATE=0.1
 * 
 * Instalación:
 *    npm install @sentry/node @sentry/profiling-node
 * 
 * Uso:
 *    import { initSentry } from './common/monitoring/sentry.config';
 *    initSentry(); // Antes de crear la app NestJS
 */

interface SentryConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  enableTracing?: boolean;
  enableProfiling?: boolean;
}

/**
 * Inicializa Sentry para monitoreo de errores y performance.
 * Solo se activa si SENTRY_DSN está definido en las variables de entorno.
 */
export function initSentry(config?: SentryConfig): boolean {
  const dsn = config?.dsn || process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('⚠️  Sentry deshabilitado (SENTRY_DSN no está configurado)');
    return false;
  }

  try {
    // Dynamic import to avoid dependency issues if not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');

    const environment =
      config?.environment ||
      process.env.SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV ||
      'development';

    const tracesSampleRate =
      config?.tracesSampleRate ||
      parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');

    Sentry.init({
      dsn,
      environment,
      tracesSampleRate,
      integrations: [
        // Auto-instrumentación de Express
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      // Filtrar errores irrelevantes
      beforeSend(event: any) {
        // No enviar errores 4xx (client errors) excepto 401/403
        if (event.exception?.values?.[0]?.value?.includes('4')) {
          const status = event.tags?.status_code;
          if (status && parseInt(status) >= 400 && parseInt(status) < 500) {
            if (![401, 403].includes(parseInt(status))) {
              return null;
            }
          }
        }
        return event;
      },
    });

    console.log(`✅ Sentry inicializado (environment: ${environment})`);
    return true;
  } catch (error: any) {
    console.warn(
      `⚠️  Sentry no pudo ser inicializado: ${error.message}. ` +
        `Instala @sentry/node para habilitar monitoreo de errores.`,
    );
    return false;
  }
}

/**
 * Captura un error manualmente en Sentry.
 * Útil para errores que no son lanzados naturalmente.
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.captureException(error, { extra: context });
  } catch {
    // Silently fail if Sentry is not installed
    console.error('Error captured (Sentry not available):', error, context);
  }
}

/**
 * Establece contexto de usuario para tracking de errores.
 */
export function setSentryUser(user: {
  id?: string;
  email?: string;
  role?: string;
}): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.setUser(user);
  } catch {
    // Silently fail if Sentry is not installed
  }
}
