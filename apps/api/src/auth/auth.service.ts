import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@campus-food/domain';
import { PrismaService } from '../prisma/prisma.service.js';
import { encodeDevToken, parseRole, toOpsRole, toWeappRoles } from './role-map.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async devLogin(userId: string, requestedRole?: string, merchantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { merchantStaff: true, riderProfile: true },
    });
    if (!user) throw new UnauthorizedException('User not found. Use seed IDs such as seed-user-student.');

    const role = parseRole(requestedRole ?? user.role) ?? (user.role as Role);
    const boundMerchantId =
      merchantId ??
      user.merchantStaff.find((s) => s.active)?.merchantId ??
      undefined;

    if (
      (role === Role.MERCHANT_OWNER || role === Role.MERCHANT_STAFF) &&
      !boundMerchantId
    ) {
      throw new UnauthorizedException('Merchant identity is not bound');
    }

    const token = encodeDevToken({
      userId: user.id,
      role,
      ...(boundMerchantId ? { merchantId: boundMerchantId } : {}),
    });

    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone ?? undefined,
        roles: toWeappRoles(role),
        merchantId: boundMerchantId,
      },
      me: {
        userId: user.id,
        displayName: user.nickname,
        roles: [toOpsRole(role)],
        merchantId: boundMerchantId,
      },
    };
  }

  async me(userId: string, role: Role, merchantId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      nickname: user.nickname,
      phone: user.phone ?? undefined,
      roles: toWeappRoles(role),
      merchantId,
      userId: user.id,
      displayName: user.nickname,
      opsRoles: [toOpsRole(role)],
    };
  }
}
