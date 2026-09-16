import { describe, expect, it } from 'vitest';
import { hasPermission, Permission, Role } from './rbac.js';

describe('rbac', () => {
  it('grants student order permissions', () => {
    expect(hasPermission(Role.STUDENT, Permission.ORDER_CREATE)).toBe(true);
    expect(hasPermission(Role.STUDENT, Permission.DISPATCH_MANAGE)).toBe(false);
  });

  it('grants ops dispatch permissions', () => {
    expect(hasPermission(Role.OPS, Permission.DISPATCH_MANAGE)).toBe(true);
    expect(hasPermission(Role.OPS, Permission.CATALOG_MANAGE)).toBe(true);
  });
});
