import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { captureError } from '../monitoring/sentry.config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'object'
          ? (message as any).message || message
          : message,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status} - Error: ${JSON.stringify(errorResponse.message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Send critical errors (5xx) to Sentry for monitoring
    if (status >= 500 && exception instanceof Error) {
      captureError(exception, {
        method: request.method,
        url: request.url,
        statusCode: status,
        user: (request as any).user?.uid || 'anonymous',
        userRole: (request as any).user?.role || 'none',
      });
    }

    response.status(status).json(errorResponse);
  }
}
