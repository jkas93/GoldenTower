import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate Limiting Interceptor
 * 
 * Limita el número de requests por IP en una ventana de tiempo.
 * Uso: 100 requests / minuto por IP por defecto.
 * 
 * NOTA: En producción con Firebase Functions, este limitador es best-effort
 * ya que cada instancia tiene su propio estado en memoria. Para rate limiting
 * más robusto, considerar Redis o Firebase Cloud Armor.
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly requests = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxRequests = 100, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup old entries every 5 minutes (unref to avoid blocking Jest)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60_000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const clientId = this.getClientId(request);

    const now = Date.now();
    const entry = this.requests.get(clientId);

    if (!entry || now > entry.resetAt) {
      // New window
      this.requests.set(clientId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
    } else {
      entry.count++;

      if (entry.count > this.maxRequests) {
        this.logger.warn(
          `Rate limit exceeded for client: ${clientId} (${entry.count} requests)`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return next.handle();
  }

  private getClientId(request: any): string {
    // Prefer X-Forwarded-For (Firebase/Cloud) or fallback to socket
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : forwarded[0];
    }
    return (
      request.ip || request.connection?.remoteAddress || 'unknown'
    );
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetAt) {
        this.requests.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Cleanup: removed ${removed} expired entries`);
    }
  }
}
