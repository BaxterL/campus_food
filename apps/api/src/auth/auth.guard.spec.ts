import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';

function mockContext(
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
): ExecutionContext {
  const request = { headers, cookies };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  const reflector = { get: vi.fn(), getAllAndOverride: vi.fn(() => false) } as unknown as Reflector;
  const prisma = { merchantStaff: { findFirst: vi.fn() } };
  const opsAuth = { resolveSession: vi.fn() };
  const guard = new AuthGuard(reflector, prisma as never, opsAuth as never);

  it('rejects missing auth in dev', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts valid dev headers', async () => {
    const result = await guard.canActivate(
      mockContext({
        'x-dev-user-id': 'user1',
        'x-dev-role': 'STUDENT',
      }),
    );
    expect(result).toBe(true);
  });

  it('accepts cookie session', async () => {
    opsAuth.resolveSession = vi.fn().mockResolvedValue({
      requestId: '',
      userId: 'seed-user-admin',
      role: 'SUPER_ADMIN',
    });
    const result = await guard.canActivate(
      mockContext({}, { ops_session: 'session-token' }),
    );
    expect(result).toBe(true);
  });
});
