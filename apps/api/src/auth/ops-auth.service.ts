import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, verifyPassword } from '@campus-food/domain';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import { toOpsRole } from './role-map.js';

const OPS_LOGIN_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.OPS,
  UserRole.MERCHANT_OWNER,
  UserRole.MERCHANT_STAFF,
]);

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const OPS_SESSION_COOKIE = 'ops_session';

@Injectable()
export class OpsAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const account = await this.prisma.opsAccount.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            merchantStaff: { where: { active: true } },
          },
        },
      },
    });

    if (!account?.active || !verifyPassword(password, account.passwordHash)) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const user = account.user;
    if (!OPS_LOGIN_ROLES.has(user.role)) {
      throw new UnauthorizedException('该账号无权登录运营后台');
    }

    const role = user.role as Role;
    const merchantId =
      role === Role.MERCHANT_OWNER || role === Role.MERCHANT_STAFF
        ? user.merchantStaff[0]?.merchantId
        : undefined;

    if ((role === Role.MERCHANT_OWNER || role === Role.MERCHANT_STAFF) && !merchantId) {
      throw new UnauthorizedException('商家账号未绑定门店');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.opsSession.create({
      data: {
        token,
        userId: user.id,
        role: user.role,
        merchantId,
        expiresAt,
      },
    });

    return {
      token,
      me: this.buildMe(user.id, user.nickname, role, merchantId),
    };
  }

  async logout(token: string | undefined) {
    if (!token) return;
    await this.prisma.opsSession.deleteMany({ where: { token } });
  }

  async resolveSession(token: string): Promise<RequestContext | null> {
    const session = await this.prisma.opsSession.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.opsSession.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      return null;
    }

    return {
      requestId: '',
      userId: session.userId,
      role: session.role as Role,
      ...(session.merchantId ? { merchantId: session.merchantId } : {}),
    };
  }

  buildMe(userId: string, displayName: string, role: Role, merchantId?: string) {
    return {
      userId,
      displayName,
      roles: [toOpsRole(role)],
      merchantId,
    };
  }
}
