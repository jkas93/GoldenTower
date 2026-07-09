import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * Audit Logging Interceptor
 * 
 * Registra todas las acciones críticas en el sistema para auditoría.
 * Loguea: método, URL, IP, usuario, timestamp, duración, y resultado.
 * 
 * En producción, considerar enviar estos logs a un sistema centralizado
 * (Firebase Cloud Logging, Datadog, Sentry, etc.)
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AUDIT');

  // Only log these methods (write operations)
  private readonly auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;

    // Only audit write operations
    if (!this.auditableMethods.includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const userId = (request as any).user?.uid || 'anonymous';
    const userRole = (request as any).user?.role || 'none';
    const clientIp = this.getClientIp(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            JSON.stringify({
              type: 'ACTION',
              method,
              url,
              userId,
              userRole,
              clientIp,
              duration,
              timestamp: new Date().toISOString(),
              status: 'SUCCESS',
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            JSON.stringify({
              type: 'ACTION',
              method,
              url,
              userId,
              userRole,
              clientIp,
              duration,
              timestamp: new Date().toISOString(),
              status: 'ERROR',
              error: error.message,
              statusCode: error.status || 500,
            }),
          );
        },
      }),
    );
  }

  private getClientIp(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : forwarded[0];
    }
    return request.ip || 'unknown';
  }
}
