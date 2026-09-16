import { Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@campus-food/domain';
import { MerchantStatus, QualificationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import {
  AcceptInvitationDto,
  InviteStaffDto,
  OnboardMerchantDto,
  ReviewQualificationDto,
  SubmitQualificationDto,
} from './merchant.dto.js';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  onboard(dto: OnboardMerchantDto) {
    return this.prisma.merchant.create({
      data: { ...dto, status: MerchantStatus.PENDING },
    });
  }

  async activate(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundError('Merchant');
    return this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: MerchantStatus.ACTIVE },
    });
  }

  listMerchants(campusId?: string) {
    return this.prisma.merchant.findMany({
      where: {
        status: MerchantStatus.ACTIVE,
        ...(campusId ? { campusId } : {}),
      },
    }).then((rows) =>
      rows.map((row) => ({
        ...row,
        isOpen: true,
        minOrderCents: 0,
        deliveryFeeCents: 200,
      })),
    );
  }

  async getMerchant(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundError('Merchant');
    return {
      ...merchant,
      isOpen: merchant.status === MerchantStatus.ACTIVE,
      minOrderCents: 0,
      deliveryFeeCents: 200,
    };
  }

  async getBoundMerchant(ctx: RequestContext) {
    if (!ctx.merchantId) throw new ForbiddenError('Merchant identity required');
    return this.getMerchant(ctx.merchantId);
  }

  async setOpen(ctx: RequestContext, isOpen: boolean) {
    if (!ctx.merchantId) throw new ForbiddenError('Merchant identity required');
    const merchant = await this.prisma.merchant.update({
      where: { id: ctx.merchantId },
      data: { status: isOpen ? MerchantStatus.ACTIVE : MerchantStatus.SUSPENDED },
    });
    return { ...merchant, isOpen };
  }

  async submitQualification(dto: SubmitQualificationDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: dto.merchantId } });
    if (!merchant) throw new NotFoundError('Merchant');
    return this.prisma.merchantQualification.create({
      data: { ...dto, status: QualificationStatus.PENDING },
    });
  }

  async reviewQualification(id: string, reviewerId: string, dto: ReviewQualificationDto) {
    const qual = await this.prisma.merchantQualification.findUnique({ where: { id } });
    if (!qual) throw new NotFoundError('Qualification');
    const updated = await this.prisma.merchantQualification.update({
      where: { id },
      data: {
        status: dto.status as QualificationStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectReason: dto.rejectReason,
      },
    });
    if (dto.status === 'APPROVED') {
      await this.prisma.merchant.update({
        where: { id: qual.merchantId },
        data: { status: MerchantStatus.ACTIVE },
      });
    }
    return updated;
  }

  async inviteStaff(ctx: RequestContext, merchantId: string, dto: InviteStaffDto) {
    if (ctx.merchantId && ctx.merchantId !== merchantId) {
      throw new ForbiddenError('Cannot invite for another merchant');
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.staffInvitation.create({
      data: {
        merchantId,
        inviterId: ctx.userId,
        phone: dto.phone,
        role: dto.role ?? UserRole.MERCHANT_STAFF,
        expiresAt,
      },
    });
  }

  async acceptInvitation(userId: string, dto: AcceptInvitationDto) {
    const invitation = await this.prisma.staffInvitation.findUnique({ where: { token: dto.token } });
    if (!invitation) throw new NotFoundError('Invitation');
    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new ForbiddenError('Invitation expired or already used');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await this.prisma.$transaction([
      this.prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptorId: userId },
      }),
      this.prisma.merchantStaff.upsert({
        where: { merchantId_userId: { merchantId: invitation.merchantId, userId } },
        update: { active: true, role: invitation.role },
        create: { merchantId: invitation.merchantId, userId, role: invitation.role },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: invitation.role },
      }),
    ]);

    return { merchantId: invitation.merchantId, role: invitation.role };
  }
}
