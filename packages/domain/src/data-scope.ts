import { Role } from './rbac.js';

export interface AuthContext {
  userId: string;
  role: Role;
  merchantId?: string;
}

export interface ScopedQuery {
  userId?: string;
  merchantId?: string;
  campusId?: string;
}

export function resolveOrderScope(ctx: AuthContext): ScopedQuery {
  switch (ctx.role) {
    case Role.SUPER_ADMIN:
    case Role.OPS:
      return {};
    case Role.MERCHANT_OWNER:
    case Role.MERCHANT_STAFF:
      return ctx.merchantId ? { merchantId: ctx.merchantId } : { merchantId: '__deny__' };
    case Role.STUDENT:
      return { userId: ctx.userId };
    case Role.RIDER:
      return { userId: ctx.userId };
    default:
      return { userId: ctx.userId };
  }
}

export function resolveMerchantScope(ctx: AuthContext): ScopedQuery {
  switch (ctx.role) {
    case Role.SUPER_ADMIN:
    case Role.OPS:
      return {};
    case Role.MERCHANT_OWNER:
    case Role.MERCHANT_STAFF:
      return ctx.merchantId ? { merchantId: ctx.merchantId } : { merchantId: '__deny__' };
    default:
      return { merchantId: '__deny__' };
  }
}
