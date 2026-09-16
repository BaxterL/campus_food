import { Role } from '@campus-food/domain';

const FRONTEND_TO_ROLE: Record<string, Role> = {
  SUPER_ADMIN: Role.SUPER_ADMIN,
  OPS: Role.OPS,
  MERCHANT_OWNER: Role.MERCHANT_OWNER,
  MERCHANT_STAFF: Role.MERCHANT_STAFF,
  STUDENT: Role.STUDENT,
  RIDER: Role.RIDER,
  platform_admin: Role.SUPER_ADMIN,
  campus_ops: Role.OPS,
  merchant_staff: Role.MERCHANT_STAFF,
  merchant: Role.MERCHANT_OWNER,
  student: Role.STUDENT,
  rider: Role.RIDER,
  dispatcher: Role.OPS,
  admin: Role.SUPER_ADMIN,
};

export function parseRole(input: string): Role | null {
  return FRONTEND_TO_ROLE[input] ?? null;
}

export function toWeappRoles(role: Role): Array<'student' | 'merchant' | 'rider' | 'dispatcher' | 'admin'> {
  switch (role) {
    case Role.SUPER_ADMIN:
      return ['admin'];
    case Role.OPS:
      return ['dispatcher'];
    case Role.MERCHANT_OWNER:
    case Role.MERCHANT_STAFF:
      return ['merchant'];
    case Role.RIDER:
      return ['rider'];
    default:
      return ['student'];
  }
}

export function toOpsRole(role: Role): 'platform_admin' | 'campus_ops' | 'merchant_staff' | 'rider' {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'platform_admin';
    case Role.OPS:
      return 'campus_ops';
    case Role.RIDER:
      return 'rider';
    default:
      return 'merchant_staff';
  }
}

export interface DevTokenPayload {
  userId: string;
  role: Role;
  merchantId?: string;
}

export function encodeDevToken(payload: DevTokenPayload): string {
  return `dev.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
}

export function decodeDevToken(token: string): DevTokenPayload | null {
  if (!token.startsWith('dev.')) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token.slice(4), 'base64url').toString('utf8')) as DevTokenPayload;
    if (!parsed.userId || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}
