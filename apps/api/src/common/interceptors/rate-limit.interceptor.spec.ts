import { RateLimitInterceptor } from './rate-limit.interceptor';
import { ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { of } from 'rxjs';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;

  const createMockContext = (ip: string): ExecutionContext => {
    const request = {
      ip,
      headers: {},
      connection: { remoteAddress: ip },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  const mockCallHandler: CallHandler = {
    handle: () => of({ success: true }),
  };

  beforeEach(() => {
    // Use small limits for testing
    interceptor = new RateLimitInterceptor(5, 60_000);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should allow requests under the limit', () => {
    const context = createMockContext('192.168.1.1');
    expect(() => {
      interceptor.intercept(context, mockCallHandler);
    }).not.toThrow();
  });

  it('should allow up to maxRequests', () => {
    const context = createMockContext('192.168.1.2');
    for (let i = 0; i < 5; i++) {
      expect(() => {
        interceptor.intercept(context, mockCallHandler);
      }).not.toThrow();
    }
  });

  it('should throw when exceeding limit', () => {
    const context = createMockContext('192.168.1.3');
    // Do 5 requests (max allowed)
    for (let i = 0; i < 5; i++) {
      interceptor.intercept(context, mockCallHandler);
    }
    // 6th request should throw
    expect(() => {
      interceptor.intercept(context, mockCallHandler);
    }).toThrow(HttpException);
  });

  it('should track different IPs separately', () => {
    const context1 = createMockContext('10.0.0.1');
    const context2 = createMockContext('10.0.0.2');

    // Exhaust limit for IP 1
    for (let i = 0; i < 5; i++) {
      interceptor.intercept(context1, mockCallHandler);
    }

    // IP 2 should still work
    expect(() => {
      interceptor.intercept(context2, mockCallHandler);
    }).not.toThrow();
  });

  it('should use X-Forwarded-For header when present', () => {
    const request = {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    expect(() => {
      interceptor.intercept(context, mockCallHandler);
    }).not.toThrow();
  });
});
