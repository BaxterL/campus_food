export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPS = 'OPS',
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  MERCHANT_STAFF = 'MERCHANT_STAFF',
  STUDENT = 'STUDENT',
  RIDER = 'RIDER',
}

export enum Permission {
  CAMPUS_READ = 'campus:read',
  CAMPUS_WRITE = 'campus:write',
  MERCHANT_ONBOARD = 'merchant:onboard',
  MERCHANT_MANAGE = 'merchant:manage',
  CATALOG_MANAGE = 'catalog:manage',
  ORDER_CREATE = 'order:create',
  ORDER_READ_OWN = 'order:read:own',
  ORDER_READ_MERCHANT = 'order:read:merchant',
  ORDER_MANAGE_MERCHANT = 'order:manage:merchant',
  PAYMENT_CREATE = 'payment:create',
  REFUND_CREATE = 'refund:create',
  RIDER_MANAGE = 'rider:manage',
  DISPATCH_MANAGE = 'dispatch:manage',
  DISPATCH_RIDER = 'dispatch:rider',
  LEDGER_READ = 'ledger:read',
}

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.OPS]: [
    Permission.CAMPUS_READ,
    Permission.CAMPUS_WRITE,
    Permission.MERCHANT_ONBOARD,
    Permission.MERCHANT_MANAGE,
    Permission.CATALOG_MANAGE,
    Permission.RIDER_MANAGE,
    Permission.DISPATCH_MANAGE,
    Permission.LEDGER_READ,
    Permission.ORDER_READ_OWN,
    Permission.ORDER_READ_MERCHANT,
    Permission.ORDER_MANAGE_MERCHANT,
    Permission.REFUND_CREATE,
  ],
  [Role.MERCHANT_OWNER]: [
    Permission.MERCHANT_MANAGE,
    Permission.CATALOG_MANAGE,
    Permission.ORDER_READ_OWN,
    Permission.ORDER_READ_MERCHANT,
    Permission.ORDER_MANAGE_MERCHANT,
    Permission.REFUND_CREATE,
  ],
  [Role.MERCHANT_STAFF]: [
    Permission.CATALOG_MANAGE,
    Permission.ORDER_READ_OWN,
    Permission.ORDER_READ_MERCHANT,
    Permission.ORDER_MANAGE_MERCHANT,
  ],
  [Role.STUDENT]: [Permission.CAMPUS_READ, Permission.ORDER_CREATE, Permission.ORDER_READ_OWN, Permission.PAYMENT_CREATE],
  [Role.RIDER]: [Permission.DISPATCH_RIDER, Permission.ORDER_READ_OWN],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} lacks permission ${permission}`);
  }
}
