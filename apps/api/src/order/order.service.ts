import { Injectable } from '@nestjs/common';
import {
  assertCanReserve,
  assertOrderTransition,
  calculateOrder,
  ConflictError,
  ForbiddenError,
  generateDeliveryCode,
  generatePickupCode,
  NotFoundError,
  OrderStatus as DomainOrderStatus,
  resolveOrderScope,
} from '@campus-food/domain';
import {
  DeliveryStatus,
  FulfillmentType,
  MerchantStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import { CreateOrderDto } from './order.dto.js';
import { toWeappOrder } from '../common/weapp-presenters.js';

const RESERVATION_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private hashRequest(dto: CreateOrderDto): string {
    return createHash('sha256').update(JSON.stringify(dto)).digest('hex');
  }

  private generateOrderNo(): string {
    const now = new Date();
    const ts = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CF${ts}${rand}`;
  }

  async createOrder(
    ctx: RequestContext,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: dto.merchantId } });
    if (!merchant || merchant.status !== MerchantStatus.ACTIVE) {
      throw new NotFoundError('Merchant');
    }

    const key = idempotencyKey ?? dto.idempotencyKey;
    if (key) {
      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { merchantId_key: { merchantId: dto.merchantId, key } },
      });
      if (existing) {
        if (existing.requestHash !== this.hashRequest(dto)) {
          throw new ConflictError('Idempotency key reused with different payload');
        }
        if (existing.responseBody) {
          return existing.responseBody;
        }
      }
    }

    const requested = dto.items.map((item) => ({
      skuId: item.skuId,
      productId: item.productId,
      qty: item.qty ?? item.quantity ?? 0,
    }));
    if (requested.some((item) => item.qty < 1 || (!item.skuId && !item.productId))) {
      throw new ConflictError('Each item needs skuId/productId and qty');
    }

    const lookupIds = [
      ...requested.map((i) => i.skuId).filter((id): id is string => Boolean(id)),
      ...requested.map((i) => i.productId).filter((id): id is string => Boolean(id)),
    ];
    const [byId, byProduct] = await Promise.all([
      lookupIds.length
        ? this.prisma.sku.findMany({
            where: { id: { in: lookupIds }, active: true },
            include: { product: true, inventory: true },
          })
        : Promise.resolve([]),
      lookupIds.length
        ? this.prisma.sku.findMany({
            where: { productId: { in: lookupIds }, active: true },
            include: { product: true, inventory: true },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    const resolved = requested.map((item) => {
      const sku =
        (item.skuId ? byId.find((s) => s.id === item.skuId) : undefined) ??
        (item.productId ? byId.find((s) => s.id === item.productId) : undefined) ??
        (item.productId ? byProduct.find((s) => s.productId === item.productId) : undefined);
      if (!sku) throw new NotFoundError('SKU');
      return { sku, qty: item.qty };
    });

    for (const row of resolved) {
      if (row.sku.product.merchantId !== dto.merchantId) {
        throw new ConflictError('All items must belong to the same merchant');
      }
    }

    const lineInputs = resolved.map(({ sku, qty }) => ({
      skuId: sku.id,
      productName: sku.product.name,
      skuName: sku.name,
      unitPriceCents: sku.priceCents,
      qty,
    }));

    const fulfillmentType =
      dto.fulfillmentType ??
      (dto.addressId ? FulfillmentType.RIDER_DELIVERY : FulfillmentType.PICKUP);
    const deliveryFeeCents = fulfillmentType === FulfillmentType.RIDER_DELIVERY ? 200 : 0;
    const calc = calculateOrder({ lines: lineInputs, deliveryFeeCents });
    const sorted = [...resolved].sort((a, b) => a.sku.id.localeCompare(b.sku.id));

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of sorted) {
        const inv = await tx.inventory.findUnique({ where: { skuId: item.sku.id } });
        if (!inv) throw new NotFoundError('Inventory');
        assertCanReserve(
          { skuId: inv.skuId, totalQty: inv.totalQty, reservedQty: inv.reservedQty },
          item.qty,
        );
        const updated = await tx.inventory.updateMany({
          where: {
            skuId: item.sku.id,
            version: inv.version,
            totalQty: { gte: inv.reservedQty + item.qty },
          },
          data: { reservedQty: { increment: item.qty }, version: { increment: 1 } },
        });
        if (updated.count !== 1) {
          throw new ConflictError('Inventory changed, please retry');
        }
      }

      const created = await tx.order.create({
        data: {
          orderNo: this.generateOrderNo(),
          userId: ctx.userId,
          merchantId: dto.merchantId,
          addressId: dto.addressId,
          fulfillmentType,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          deliveryStatus:
            fulfillmentType === FulfillmentType.RIDER_DELIVERY
              ? DeliveryStatus.PENDING_DISPATCH
              : DeliveryStatus.NONE,
          subtotalCents: calc.subtotalCents,
          deliveryFeeCents: calc.deliveryFeeCents,
          totalCents: calc.totalCents,
          remark: dto.remark,
          idempotencyKey: key ?? null,
          items: {
            create: calc.items.map((i) => ({
              skuId: i.skuId,
              productName: i.productName,
              skuName: i.skuName,
              unitPriceCents: i.unitPriceCents,
              qty: i.qty,
              totalCents: i.totalCents,
            })),
          },
        },
        include: { items: true, merchant: true, payment: true, address: { include: { building: true } } },
      });

      const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
      for (const item of sorted) {
        await tx.inventoryReservation.create({
          data: { skuId: item.sku.id, orderId: created.id, qty: item.qty, expiresAt },
        });
      }

      await tx.outboxMessage.create({
        data: {
          eventType: 'order.created',
          payload: { orderId: created.id, orderNo: created.orderNo },
        },
      });
      await tx.job.create({
        data: {
          type: 'order.close_unpaid',
          payload: { orderId: created.id },
          runAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      return created;
    });

    const response = toWeappOrder(order);
    if (key) {
      await this.prisma.idempotencyKey.upsert({
        where: { merchantId_key: { merchantId: dto.merchantId, key } },
        update: { responseBody: response as Prisma.InputJsonValue, statusCode: 201 },
        create: {
          merchantId: dto.merchantId,
          key,
          requestHash: this.hashRequest(dto),
          responseBody: response as Prisma.InputJsonValue,
          statusCode: 201,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    return response;
  }

  async getOrder(ctx: RequestContext, orderId: string) {
    const scope = resolveOrderScope(ctx);
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(scope.userId ? { userId: scope.userId } : {}),
        ...(scope.merchantId ? { merchantId: scope.merchantId } : {}),
      },
      include: { items: true, payment: true, dispatch: true, merchant: true, address: { include: { building: true } } },
    });
    if (!order) throw new NotFoundError('Order');
    return toWeappOrder(order);
  }

  async listOrders(ctx: RequestContext) {
    const scope = resolveOrderScope(ctx);
    return this.prisma.order.findMany({
      where: {
        ...(scope.userId ? { userId: scope.userId } : {}),
        ...(scope.merchantId ? { merchantId: scope.merchantId } : {}),
      },
      include: { items: true, merchant: true, payment: true, address: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).then((rows) => rows.map((row) => toWeappOrder(row)));
  }

  private async toWeappOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, merchant: true, payment: true, address: { include: { building: true } } },
    });
    if (!order) throw new NotFoundError('Order');
    return toWeappOrder(order);
  }

  private async transitionOrder(orderId: string, from: OrderStatus, to: OrderStatus) {
    assertOrderTransition(from as DomainOrderStatus, to as DomainOrderStatus);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.status !== from) {
      throw new ConflictError(`Order status is ${order.status}, expected ${from}`);
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: to },
      include: { items: true },
    });
  }

  async merchantAccept(ctx: RequestContext, orderId: string) {
    await this.assertMerchantOrder(ctx, orderId);
    const order = await this.transitionOrder(orderId, OrderStatus.MERCHANT_PENDING, OrderStatus.ACCEPTED);
    await this.prisma.outboxMessage.create({
      data: { eventType: 'order.accepted', payload: { orderId } },
    });
    return this.toWeappOrderById(orderId);
  }

  async merchantReject(ctx: RequestContext, orderId: string) {
    await this.assertMerchantOrder(ctx, orderId);
    const order = await this.transitionOrder(orderId, OrderStatus.MERCHANT_PENDING, OrderStatus.REJECTED);
    await this.releaseInventory(orderId);
    return this.toWeappOrderById(order.id);
  }

  async merchantPreparing(ctx: RequestContext, orderId: string) {
    await this.assertMerchantOrder(ctx, orderId);
    await this.transitionOrder(orderId, OrderStatus.ACCEPTED, OrderStatus.PREPARING);
    return this.toWeappOrderById(orderId);
  }

  async merchantReadyFromCurrent(ctx: RequestContext, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.status === OrderStatus.MERCHANT_PENDING) {
      await this.merchantAccept(ctx, orderId);
    }
    const current = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (current?.status === OrderStatus.ACCEPTED) {
      await this.merchantPreparing(ctx, orderId);
    }
    return this.merchantReady(ctx, orderId);
  }

  async cancelUnpaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return null;
    if (order.status !== OrderStatus.PENDING_PAYMENT) return order;
    await this.transitionOrder(orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED);
    await this.releaseInventory(orderId);
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }
  async merchantReady(ctx: RequestContext, orderId: string) {
    await this.assertMerchantOrder(ctx, orderId);
    const order = await this.transitionOrder(orderId, OrderStatus.PREPARING, OrderStatus.READY);
    const pickupCode = generatePickupCode();
    const deliveryCode =
      order.fulfillmentType === FulfillmentType.RIDER_DELIVERY ? generateDeliveryCode() : null;
    return this.prisma.order.update({
      where: { id: orderId },
      data: { pickupCode, deliveryCode },
    }).then(() => this.toWeappOrderById(orderId));
  }

  async verifyPickup(ctx: RequestContext, orderId: string, pickupCode: string) {
    await this.assertMerchantOrder(ctx, orderId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.pickupCode !== pickupCode) {
      throw new ConflictError('Invalid pickup code');
    }
    if (order.status !== OrderStatus.READY) {
      throw new ConflictError('Order is not ready for pickup');
    }
    return this.completeOrder(orderId);
  }

  async verifyDelivery(ctx: RequestContext, orderOrDispatchId: string, deliveryCode: string) {
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { OR: [{ orderId: orderOrDispatchId }, { id: orderOrDispatchId }] },
    });
    const orderId = dispatch?.orderId ?? orderOrDispatchId;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.deliveryCode !== deliveryCode) {
      throw new ConflictError('Invalid delivery code');
    }
    if (ctx.role === 'RIDER' && order.deliveryStatus !== DeliveryStatus.PICKED_UP) {
      throw new ConflictError('Order not picked up yet');
    }
    if (dispatch) {
      await this.prisma.dispatch.update({
        where: { id: dispatch.id },
        data: { deliveredAt: new Date() },
      });
    }
    return this.completeOrder(orderId, DeliveryStatus.DELIVERED);
  }

  private async completeOrder(orderId: string, deliveryStatus?: DeliveryStatus) {
    await this.transitionOrder(orderId, OrderStatus.READY, OrderStatus.COMPLETED);
    await this.commitInventory(orderId);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        completedAt: new Date(),
        ...(deliveryStatus ? { deliveryStatus } : {}),
      },
    });
    return this.toWeappOrderById(orderId);
  }

  private async assertMerchantOrder(ctx: RequestContext, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (ctx.merchantId && order.merchantId !== ctx.merchantId) {
      throw new ForbiddenError('Not your merchant order');
    }
  }

  private async releaseInventory(orderId: string) {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { orderId, released: false },
    });
    await this.prisma.$transaction(
      reservations.map((r) =>
        this.prisma.inventory.update({
          where: { skuId: r.skuId },
          data: { reservedQty: { decrement: r.qty } },
        }),
      ),
    );
    await this.prisma.inventoryReservation.updateMany({
      where: { orderId },
      data: { released: true },
    });
  }

  private async commitInventory(orderId: string) {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { orderId, released: false },
    });
    await this.prisma.$transaction(
      reservations.flatMap((r) => [
        this.prisma.inventory.update({
          where: { skuId: r.skuId },
          data: { totalQty: { decrement: r.qty }, reservedQty: { decrement: r.qty } },
        }),
        this.prisma.inventoryReservation.update({
          where: { id: r.id },
          data: { released: true },
        }),
      ]),
    );
  }

  async markPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    assertOrderTransition(order.status as DomainOrderStatus, DomainOrderStatus.PAID);
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  async markMerchantPending(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    await this.transitionOrder(orderId, OrderStatus.PAID, OrderStatus.MERCHANT_PENDING);
    return this.toWeappOrderById(orderId);
  }
}
