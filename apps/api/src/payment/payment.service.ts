import { Injectable } from '@nestjs/common';
import {
  assertOrderTransition,
  createPaymentEntry,
  createRefundEntry,
  ForbiddenError,
  getPaymentProvider,
  NotFoundError,
  PaymentProviderType,
} from '@campus-food/domain';
import { OrderStatus, PaymentProvider, PaymentStatus, RefundStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import { OrderService } from '../order/order.service.js';
import { CreatePaymentDto, CreateRefundDto } from './payment.dto.js';
import { toPaymentIntent } from '../common/weapp-presenters.js';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
  ) {}

  private mapProvider(provider: PaymentProvider): PaymentProviderType {
    return provider as PaymentProviderType;
  }

  async createPayment(ctx: RequestContext, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.userId !== ctx.userId) throw new ForbiddenError('Not your order');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ForbiddenError('Order is not pending payment');
    }

    const provider = getPaymentProvider(this.mapProvider(dto.provider));
    const result = await provider.createPayment({
      orderId: order.id,
      orderNo: order.orderNo,
      amountCents: order.totalCents,
      userId: order.userId,
      merchantId: order.merchantId,
    });

    if (!result.success) {
      await this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: { status: PaymentStatus.FAILED },
        create: {
          orderId: order.id,
          provider: dto.provider,
          amountCents: order.totalCents,
          status: PaymentStatus.FAILED,
        },
      });
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
      return { success: false, error: result.errorMessage };
    }

    if (dto.provider === PaymentProvider.OFFLINE_MERCHANT_DIRECT) {
      assertOrderTransition(order.status as never, 'MERCHANT_PENDING' as never);
      const payment = await this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: { status: PaymentStatus.PENDING, providerRef: result.providerRef },
        create: {
          orderId: order.id,
          provider: dto.provider,
          amountCents: order.totalCents,
          status: PaymentStatus.PENDING,
          providerRef: result.providerRef,
        },
      });
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.MERCHANT_PENDING, paymentStatus: PaymentStatus.PENDING },
      });
      return toPaymentIntent({
        orderId: order.id,
        provider: dto.provider,
        status: payment.status,
      });
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: PaymentStatus.PAID,
          providerRef: result.providerRef,
          paidAt: new Date(),
        },
        create: {
          orderId: order.id,
          provider: dto.provider,
          amountCents: order.totalCents,
          status: PaymentStatus.PAID,
          providerRef: result.providerRef,
          paidAt: new Date(),
        },
      });

      const entry = createPaymentEntry(
        `le_${uuidv4()}`,
        order.id,
        order.userId,
        order.totalCents,
      );
      await tx.ledgerEntry.create({
        data: {
          entryNo: entry.entryNo,
          type: entry.type,
          orderId: entry.orderId,
          userId: entry.userId,
          amountCents: entry.amountCents,
          memo: entry.memo,
        },
      });

      await tx.outboxMessage.create({
        data: {
          eventType: 'payment.completed',
          payload: { orderId: order.id, paymentId: p.id },
        },
      });

      return p;
    });

    await this.orderService.markPaid(order.id);
    await this.orderService.markMerchantPending(order.id);

    return toPaymentIntent({
      orderId: order.id,
      provider: dto.provider,
      status: payment.status,
    });
  }

  async createRefund(ctx: RequestContext, dto: CreateRefundDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundError('Order');
    if (!order.payment || order.payment.status !== PaymentStatus.PAID) {
      throw new ForbiddenError('No paid payment to refund');
    }

    const provider = getPaymentProvider(this.mapProvider(order.payment.provider));
    const result = await provider.createRefund({
      orderId: order.id,
      paymentProviderRef: order.payment.providerRef ?? undefined,
      amountCents: order.totalCents,
      reason: dto.reason,
    });

    if (!result.success) {
      return { success: false, error: result.errorMessage };
    }

    const refund = await this.prisma.$transaction(async (tx) => {
      const r = await tx.refund.create({
        data: {
          orderId: order.id,
          amountCents: order.totalCents,
          status: RefundStatus.COMPLETED,
          reason: dto.reason,
          refundedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.REFUNDED, refundStatus: RefundStatus.COMPLETED },
      });

      const entry = createRefundEntry(
        `le_${uuidv4()}`,
        order.id,
        order.userId,
        order.totalCents,
      );
      await tx.ledgerEntry.create({
        data: {
          entryNo: entry.entryNo,
          type: entry.type,
          orderId: entry.orderId,
          userId: entry.userId,
          amountCents: entry.amountCents,
          memo: entry.memo,
        },
      });

      await tx.outboxMessage.create({
        data: { eventType: 'refund.completed', payload: { orderId: order.id, refundId: r.id } },
      });

      return r;
    });

    return { success: true, refund };
  }

  async getStatus(ctx: RequestContext, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundError('Order');
    if (order.userId !== ctx.userId && ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'OPS') {
      throw new ForbiddenError('Not your order');
    }
    return toPaymentIntent({
      orderId: order.id,
      provider: order.payment?.provider ?? PaymentProvider.MOCK,
      status: order.paymentStatus,
    });
  }
}
