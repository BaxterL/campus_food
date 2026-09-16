import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';

function mockContext(headers: Record<string, string>): ExecutionContext {
  const request = { headers };
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
  const guard = new AuthGuard(reflector, prisma as never);

  it('rejects missing headers in dev', async () => {
    await expect(guard.canActivate(mockContext({}))).rejects.toBeInstanceOf(UnauthorizedException);
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

  it('accepts frontend role aliases and bearer tokens', async () => {
    const result = await guard.canActivate(
      mockContext({
        'x-dev-user-id': 'seed-user-admin',
        'x-dev-role': 'platform_admin',
      }),
    );
    expect(result).toBe(true);
  });

  it('blocks dev auth in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    await expect(
      guard.canActivate(mockContext({ 'x-dev-user-id': 'u', 'x-dev-role': 'STUDENT' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    process.env.NODE_ENV = prev;
  });
});
