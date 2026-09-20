import { describe, expect, it } from 'vitest';
import { hasPermission, Permission, Role } from './rbac.js';

describe('rbac', () => {
  it('grants student order permissions', () => {
    expect(hasPermission(Role.STUDENT, Permission.ORDER_CREATE)).toBe(true);
    expect(hasPermission(Role.STUDENT, Permission.DISPATCH_MANAGE)).toBe(false);
  });

  it('does not give merchant staff platform ledger access', () => {
    expect(hasPermission(Role.MERCHANT_STAFF, Permission.LEDGER_READ)).toBe(false);
    expect(hasPermission(Role.MERCHANT_STAFF, Permission.ORDER_READ_MERCHANT)).toBe(true);
  });
});
