import { AuditLogInterceptor } from './audit-log.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;

  const createMockContext = (
    method: string,
    url: string,
    user?: any,
    ip?: string,
  ): ExecutionContext => {
    const request = {
      method,
      url,
      user,
      ip: ip || '127.0.0.1',
      headers: ip ? { 'x-forwarded-for': ip } : {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    interceptor = new AuditLogInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should skip audit for GET requests', (done) => {
    const context = createMockContext('GET', '/api/data');
    const handler: CallHandler = {
      handle: () => of({ data: 'test' }),
    };

    interceptor.intercept(context, handler).subscribe({
      next: (result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      },
    });
  });

  it('should log successful POST requests', (done) => {
    const context = createMockContext('POST', '/api/employees', {
      uid: 'user-123',
      role: 'GERENTE',
    });
    const handler: CallHandler = {
      handle: () => of({ id: 'new-emp' }),
    };

    interceptor.intercept(context, handler).subscribe({
      next: (result) => {
        expect(result).toEqual({ id: 'new-emp' });
        done();
      },
    });
  });

  it('should log DELETE requests', (done) => {
    const context = createMockContext('DELETE', '/api/employees/123', {
      uid: 'user-1',
      role: 'GERENTE',
    });
    const handler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(context, handler).subscribe({
      next: () => done(),
    });
  });

  it('should log failed requests as errors', (done) => {
    const context = createMockContext('PATCH', '/api/employees/123', {
      uid: 'user-1',
      role: 'RRHH',
    });
    const error = new Error('Test error');
    const handler: CallHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(context, handler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });

  it('should handle anonymous users', (done) => {
    const context = createMockContext('POST', '/api/public');
    const handler: CallHandler = {
      handle: () => of({}),
    };

    interceptor.intercept(context, handler).subscribe({
      next: () => done(),
    });
  });

  it('should handle X-Forwarded-For header', (done) => {
    const context = createMockContext(
      'POST',
      '/api/data',
      { uid: 'user-1', role: 'GERENTE' },
      '203.0.113.1, 10.0.0.1',
    );
    const handler: CallHandler = {
      handle: () => of({}),
    };

    interceptor.intercept(context, handler).subscribe({
      next: () => done(),
    });
  });
});
