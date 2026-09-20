import type { OpsRole } from '@/api/types';

export const PLATFORM_ROLES: OpsRole[] = ['platform_admin', 'campus_ops'];
export const MERCHANT_OPS_ROLES: OpsRole[] = ['merchant_staff', ...PLATFORM_ROLES];

export function isPlatformRole(role: OpsRole): boolean {
  return PLATFORM_ROLES.includes(role);
}

export function isMerchantStaff(role: OpsRole): boolean {
  return role === 'merchant_staff';
}

export function primaryOpsRole(roles: OpsRole[]): OpsRole {
  return roles[0] ?? 'merchant_staff';
}
