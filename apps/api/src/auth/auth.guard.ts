import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission, Permission, Role } from '@campus-food/domain';
import { RequestContext } from '../common/request-context.js';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import { PERMISSION_KEY } from '../common/decorators/require-permission.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { decodeDevToken, parseRole } from './role-map.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev header auth is disabled in production');
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: RequestContext;
    }>();

    const authHeader = request.headers.authorization ?? request.headers.Authorization;
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const tokenPayload = bearer ? decodeDevToken(bearer) : null;

    const userId = tokenPayload?.userId ?? request.headers['x-dev-user-id'];
    const roleHeader = tokenPayload?.role ?? request.headers['x-dev-role'];
    let merchantId = tokenPayload?.merchantId ?? request.headers['x-dev-merchant-id'];

    if (!userId || !roleHeader) {
      throw new UnauthorizedException('Missing x-dev-user-id or x-dev-role header');
    }

    const role = typeof roleHeader === 'string' ? parseRole(String(roleHeader)) : roleHeader;
    if (!role || !Object.values(Role).includes(role)) {
      throw new UnauthorizedException(`Invalid role: ${String(roleHeader)}`);
    }

    if (!merchantId && (role === Role.MERCHANT_OWNER || role === Role.MERCHANT_STAFF)) {
      const staff = await this.prisma.merchantStaff.findFirst({
        where: { userId, active: true },
      });
      merchantId = staff?.merchantId;
    }

    request.user = {
      requestId: request.headers['x-request-id'] ?? '',
      userId,
      role,
      ...(merchantId ? { merchantId } : {}),
    };

    const requiredPermission = this.reflector.get<Permission | undefined>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (requiredPermission && !hasPermission(role, requiredPermission)) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return true;
  }
}
