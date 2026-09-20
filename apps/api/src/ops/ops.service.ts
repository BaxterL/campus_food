import { Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError, Role } from '@campus-food/domain';
import { resolveCampusId } from '../common/default-campus.js';
import {
  DeliveryStatus,
  MerchantStatus,
  OrderStatus,
  Prisma,
  RefundStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import { saveProductImage } from '../common/uploads.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { DeliveryService } from '../delivery/delivery.service.js';
import { MerchantService } from '../merchant/merchant.service.js';
import { OrderService } from '../order/order.service.js';
import { AuthService } from '../auth/auth.service.js';

const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  CREATED: 'pending_payment',
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  MERCHANT_PENDING: 'merchant_pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const OPS_STATUS_TO_DOMAIN: Record<string, OrderStatus[]> = {
  pending_payment: [OrderStatus.PENDING_PAYMENT, OrderStatus.CREATED],
  paid: [OrderStatus.PAID],
  merchant_pending: [OrderStatus.MERCHANT_PENDING],
  accepted: [OrderStatus.ACCEPTED],
  rejected: [OrderStatus.REJECTED],
  preparing: [OrderStatus.PREPARING],
  ready: [OrderStatus.READY],
  dispatch_pending: [OrderStatus.READY],
  dispatched: [OrderStatus.READY],
  delivering: [OrderStatus.READY],
  completed: [OrderStatus.COMPLETED],
  cancelled: [OrderStatus.CANCELLED],
  refunded: [OrderStatus.CANCELLED],
};

@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchants: MerchantService,
    private readonly catalog: CatalogService,
    private readonly orders: OrderService,
    private readonly delivery: DeliveryService,
    private readonly auth: AuthService,
  ) {}

  async me(ctx: RequestContext) {
    const profile = await this.auth.me(ctx.userId, ctx.role, ctx.merchantId);
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      roles: profile.opsRoles,
      merchantId: profile.merchantId,
    };
  }

  async devLogin(userId: string, role?: string, merchantId?: string) {
    const result = await this.auth.devLogin(userId, role, merchantId);
    return result.me;
  }

  private scopedMerchantId(ctx: RequestContext, requested?: string): string | undefined {
    if (ctx.role === Role.MERCHANT_OWNER || ctx.role === Role.MERCHANT_STAFF) {
      if (!ctx.merchantId) throw new ForbiddenError('Merchant identity required');
      if (requested && requested !== ctx.merchantId) {
        throw new ForbiddenError('Merchant scope mismatch');
      }
      return ctx.merchantId;
    }
    return requested;
  }

  async stats(ctx: RequestContext) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const merchantId = this.scopedMerchantId(ctx);
    const merchantFilter = merchantId ? { merchantId } : {};
    const [todayOrders, paidToday, pendingMerchants, pendingDispatch, activeRiders, refundExceptions] =
      await Promise.all([
        this.prisma.order.count({ where: { createdAt: { gte: start }, ...merchantFilter } }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: start }, paymentStatus: 'PAID', ...merchantFilter },
          _sum: { totalCents: true },
        }),
        merchantId
          ? Promise.resolve(0)
          : this.prisma.merchant.count({ where: { status: MerchantStatus.PENDING } }),
        this.prisma.order.count({
          where: {
            ...merchantFilter,
            fulfillmentType: 'RIDER_DELIVERY',
            deliveryStatus: { in: [DeliveryStatus.PENDING_DISPATCH, DeliveryStatus.DISPATCHED] },
          },
        }),
        merchantId ? Promise.resolve(0) : this.prisma.rider.count({ where: { active: true } }),
        merchantId
          ? this.prisma.refund.count({
              where: { status: RefundStatus.FAILED, order: { merchantId } },
            })
          : this.prisma.refund.count({ where: { status: RefundStatus.FAILED } }),
      ]);
    return {
      todayOrders,
      todayRevenueCents: paidToday._sum.totalCents ?? 0,
      pendingMerchants,
      pendingDispatch,
      activeRiders,
      refundExceptions,
      scope: merchantId ? 'merchant' : 'platform',
    };
  }

  private mapMerchant(m: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    campusId: string;
    status: MerchantStatus;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
  }) {
    return {
      id: m.id,
      name: m.name,
      contactName: m.name,
      contactPhone: m.phone ?? '',
      address: m.address ?? '',
      campusId: m.campusId,
      reviewStatus:
        m.status === MerchantStatus.REJECTED
          ? 'rejected'
          : m.status === MerchantStatus.PENDING
            ? 'pending'
            : 'approved',
      runStatus: m.status === MerchantStatus.ACTIVE ? 'active' : 'inactive',
      remark: m.description ?? undefined,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }

  async listMerchants(query: {
    page?: number;
    pageSize?: number;
    campusId?: string;
    reviewStatus?: string;
    runStatus?: string;
    keyword?: string;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: Prisma.MerchantWhereInput = {
      ...(query.campusId ? { campusId: query.campusId } : {}),
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' } } : {}),
    };
    if (query.reviewStatus === 'pending') where.status = MerchantStatus.PENDING;
    if (query.reviewStatus === 'rejected') where.status = MerchantStatus.REJECTED;
    if (query.runStatus === 'active') where.status = MerchantStatus.ACTIVE;
    if (query.runStatus === 'inactive') where.status = { in: [MerchantStatus.SUSPENDED, MerchantStatus.PENDING] };

    const [items, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchant.count({ where }),
    ]);
    return { items: items.map((m) => this.mapMerchant(m)), total, page, pageSize };
  }

  async getMerchant(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundError('Merchant');
    return this.mapMerchant(merchant);
  }

  createMerchant(input: {
    name: string;
    contactPhone?: string;
    address?: string;
    campusId?: string;
    remark?: string;
  }) {
    return this.merchants.onboard({
      campusId: resolveCampusId(input.campusId),
      name: input.name,
      phone: input.contactPhone,
      address: input.address,
      description: input.remark,
    }).then((m) => this.mapMerchant(m));
  }

  async updateMerchant(
    id: string,
    input: { name?: string; contactPhone?: string; address?: string; remark?: string },
  ) {
    const merchant = await this.prisma.merchant.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.contactPhone,
        address: input.address,
        description: input.remark,
      },
    });
    return this.mapMerchant(merchant);
  }

  async approveMerchant(id: string) {
    return this.mapMerchant(await this.merchants.activate(id));
  }

  async rejectMerchant(id: string) {
    const merchant = await this.prisma.merchant.update({
      where: { id },
      data: { status: MerchantStatus.REJECTED },
    });
    return this.mapMerchant(merchant);
  }

  async toggleMerchant(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundError('Merchant');
    const next =
      merchant.status === MerchantStatus.ACTIVE ? MerchantStatus.SUSPENDED : MerchantStatus.ACTIVE;
    return this.mapMerchant(
      await this.prisma.merchant.update({ where: { id }, data: { status: next } }),
    );
  }

  async listProducts(
    ctx: RequestContext,
    query: { merchantId?: string; page?: number; pageSize?: number },
  ) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 50, 100);
    const merchantId = this.scopedMerchantId(ctx, query.merchantId);
    const where: Prisma.SkuWhereInput = {
      ...(merchantId ? { product: { merchantId } } : {}),
    };
    const [skus, total] = await Promise.all([
      this.prisma.sku.findMany({
        where,
        include: { inventory: true, product: { include: { merchant: true, category: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sku.count({ where }),
    ]);
    return {
      items: skus.map((sku) => this.mapSku(sku)),
      total,
      page,
      pageSize,
    };
  }

  private mapSku(sku: {
    id: string;
    name: string;
    priceCents: number;
    active: boolean;
    updatedAt: Date;
    inventory: { totalQty: number; reservedQty: number } | null;
    product: {
      name: string;
      imageUrl: string | null;
      merchantId: string;
      active?: boolean;
      merchant: { name: string };
      category: { name: string } | null;
    };
  }) {
    return {
      id: sku.id,
      merchantId: sku.product.merchantId,
      merchantName: sku.product.merchant.name,
      name: `${sku.product.name} ${sku.name}`,
      productName: sku.product.name,
      imageUrl: sku.product.imageUrl ?? undefined,
      categoryName: sku.product.category?.name ?? '',
      skuCode: sku.id.slice(0, 8),
      priceCents: sku.priceCents,
      stock: sku.inventory?.totalQty ?? 0,
      reservedStock: sku.inventory?.reservedQty ?? 0,
      isOnSale: sku.active && sku.product.active,
      updatedAt: sku.updatedAt.toISOString(),
    };
  }

  async listCategories(ctx: RequestContext, requestedMerchantId?: string) {
    const merchantId = this.scopedMerchantId(ctx, requestedMerchantId);
    if (!merchantId) throw new ForbiddenError('Merchant required');
    return this.catalog.listCategories(merchantId);
  }

  async createProduct(
    ctx: RequestContext,
    input: {
      merchantId?: string;
      name: string;
      description?: string;
      imageUrl?: string;
      categoryId?: string;
      categoryName?: string;
      skuName?: string;
      priceCents: number;
      stock?: number;
    },
  ) {
    const merchantId = this.scopedMerchantId(ctx, input.merchantId);
    if (!merchantId) throw new ForbiddenError('Merchant required');
    let categoryId = input.categoryId;
    if (!categoryId && input.categoryName?.trim()) {
      const category = await this.catalog.createCategory(ctx, {
        merchantId,
        name: input.categoryName.trim(),
      });
      categoryId = category.id;
    }
    const product = await this.catalog.createProduct(ctx, {
      merchantId,
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      categoryId,
    });
    const sku = await this.catalog.createSku(ctx, {
      productId: product.id,
      name: input.skuName?.trim() || '默认',
      priceCents: input.priceCents,
      initialQty: input.stock ?? 0,
    });
    const full = await this.prisma.sku.findUnique({
      where: { id: sku!.id },
      include: { inventory: true, product: { include: { merchant: true, category: true } } },
    });
    if (!full) throw new NotFoundError('SKU');
    return this.mapSku(full);
  }

  async uploadImage(file: Express.Multer.File | undefined) {
    const imageUrl = await saveProductImage(file);
    return { imageUrl };
  }

  async updateInventory(skuId: string, ctx: RequestContext, input: { stock?: number; isOnSale?: boolean }) {
    if (input.stock !== undefined) {
      await this.catalog.updateInventory(ctx, skuId, { totalQty: input.stock });
    }
    if (input.isOnSale !== undefined) {
      await this.catalog.setSkuActive(ctx, skuId, { active: input.isOnSale });
    }
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { inventory: true, product: { include: { merchant: true, category: true } } },
    });
    if (!sku) throw new NotFoundError('SKU');
    return this.mapSku(sku);
  }

  private mapOrder(order: {
    id: string;
    orderNo: string;
    merchantId: string;
    merchant: { name: string };
    status: OrderStatus;
    totalCents: number;
    fulfillmentType?: string;
    pickupCode: string | null;
    deliveryCode: string | null;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
    address?: { room: string; phone: string; building: { name: string } } | null;
    items: Array<{ productName: string; skuName: string; qty: number; unitPriceCents: number }>;
    dispatch?: { riderId: string | null; rider?: { nickname: string } | null } | null;
  }) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      merchantId: order.merchantId,
      merchantName: order.merchant.name,
      fulfillmentType: order.fulfillmentType,
      status: ORDER_STATUS_MAP[order.status],
      totalCents: order.totalCents,
      pickupCode: order.pickupCode ?? undefined,
      deliveryCode: order.deliveryCode ?? undefined,
      riderId: order.dispatch?.riderId ?? undefined,
      riderName: order.dispatch?.rider?.nickname ?? undefined,
      customerPhone: order.address?.phone ?? '',
      buildingName: order.address?.building.name ?? '',
      roomNo: order.address?.room ?? '',
      remark: order.remark ?? undefined,
      items: order.items.map((item) => ({
        productName: item.productName,
        skuCode: item.skuName,
        quantity: item.qty,
        unitPriceCents: item.unitPriceCents,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  async listOrders(
    ctx: RequestContext,
    query: { page?: number; pageSize?: number; merchantId?: string; status?: string | string[] },
  ) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 50, 100);
    const statuses = (Array.isArray(query.status) ? query.status : query.status ? [query.status] : [])
      .flatMap((s) => OPS_STATUS_TO_DOMAIN[s] ?? []);
    const merchantId = this.scopedMerchantId(ctx, query.merchantId);
    const where: Prisma.OrderWhereInput = {
      ...(merchantId ? { merchantId } : {}),
      ...(statuses.length ? { status: { in: statuses } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          merchant: true,
          address: { include: { building: true } },
          items: true,
          dispatch: { include: { rider: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items: items.map((o) => this.mapOrder(o)), total, page, pageSize };
  }

  async getOrder(ctx: RequestContext, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        merchant: true,
        address: { include: { building: true } },
        items: true,
        dispatch: { include: { rider: true } },
      },
    });
    if (!order) throw new NotFoundError('Order');
    const merchantId = this.scopedMerchantId(ctx);
    if (merchantId && order.merchantId !== merchantId) {
      throw new ForbiddenError('Not your merchant order');
    }
    return this.mapOrder(order);
  }

  async accept(ctx: RequestContext, id: string) {
    await this.orders.merchantAccept(ctx, id);
    return this.getOrder(ctx, id);
  }

  async reject(ctx: RequestContext, id: string) {
    await this.orders.merchantReject(ctx, id);
    return this.getOrder(ctx, id);
  }

  async markReady(ctx: RequestContext, id: string) {
    await this.orders.merchantReadyFromCurrent(ctx, id);
    return this.getOrder(ctx, id);
  }

  async verifyPickup(ctx: RequestContext, id: string, pickupCode: string) {
    await this.orders.verifyPickup(ctx, id, pickupCode);
    return this.getOrder(ctx, id);
  }

  async pendingDispatch() {
    const orders = await this.prisma.order.findMany({
      where: {
        fulfillmentType: 'RIDER_DELIVERY',
        deliveryStatus: { in: [DeliveryStatus.PENDING_DISPATCH, DeliveryStatus.DISPATCHED] },
      },
      include: {
        merchant: true,
        address: { include: { building: true } },
        items: true,
        dispatch: { include: { rider: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return orders.map((order) => ({
      ...this.mapOrder(order),
      waitMinutes: Math.floor((Date.now() - order.createdAt.getTime()) / 60000),
    }));
  }

  async dispatchRiders() {
    const riders = await this.prisma.rider.findMany({ include: { user: true, duties: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Promise.all(
      riders.map(async (rider) => {
        const activeOrders = await this.prisma.dispatch.count({
          where: {
            riderId: rider.userId,
            deliveredAt: null,
            order: { status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED] } },
          },
        });
        const onDuty = rider.duties.some((d) => d.active && d.date.getTime() === today.getTime());
        return {
          id: rider.userId,
          name: rider.name,
          phone: rider.phone,
          dutyStatus: !rider.active ? 'off_duty' : activeOrders > 0 ? 'busy' : onDuty ? 'on_duty' : 'off_duty',
          activeOrders,
          campusId: rider.campusId,
        };
      }),
    );
  }

  async assign(ctx: RequestContext, orderId: string, riderId: string) {
    await this.delivery.assignDispatch(ctx, { orderId, riderId });
    return this.getOrder(ctx, orderId);
  }

  async reassign(ctx: RequestContext, orderId: string, riderId: string) {
    await this.delivery.reassignDispatch(ctx, orderId, { riderId });
    return this.getOrder(ctx, orderId);
  }

  async listWhitelist(campusId?: string) {
    const riders = await this.prisma.rider.findMany({
      where: campusId ? { campusId } : {},
      include: { duties: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return riders.map((rider) => ({
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      campusId: rider.campusId,
      isActive: rider.active,
      onDuty: rider.duties.some((d) => d.active && d.date.getTime() === today.getTime()),
      createdAt: rider.createdAt.toISOString(),
    }));
  }

  async createWhitelist(input: { name: string; phone: string; campusId?: string; userId?: string }) {
    const user =
      (input.userId
        ? await this.prisma.user.findUnique({ where: { id: input.userId } })
        : await this.prisma.user.findUnique({ where: { phone: input.phone } })) ??
      (await this.prisma.user.create({
        data: { phone: input.phone, nickname: input.name, role: 'RIDER' },
      }));
    const rider = await this.delivery.createRider({
      userId: user.id,
      campusId: resolveCampusId(input.campusId),
      name: input.name,
      phone: input.phone,
    });
    return {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      campusId: rider.campusId,
      isActive: rider.active,
      onDuty: false,
      createdAt: rider.createdAt.toISOString(),
    };
  }

  async updateWhitelist(id: string, input: { isActive?: boolean; name?: string; phone?: string }) {
    const rider = await this.prisma.rider.update({
      where: { id },
      data: {
        ...(input.isActive === undefined ? {} : { active: input.isActive }),
        name: input.name,
        phone: input.phone,
      },
    });
    return {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      campusId: rider.campusId,
      isActive: rider.active,
      onDuty: false,
      createdAt: rider.createdAt.toISOString(),
    };
  }

  async refundExceptions() {
    const refunds = await this.prisma.refund.findMany({
      where: { status: { in: [RefundStatus.FAILED, RefundStatus.PENDING] } },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return refunds.map((refund) => ({
      id: refund.id,
      orderNo: refund.order.orderNo,
      refundNo: refund.id,
      amountCents: refund.amountCents,
      reason: refund.reason ?? '待处理退款',
      status: refund.status === RefundStatus.FAILED ? 'open' : 'open',
      createdAt: refund.createdAt.toISOString(),
    }));
  }

  async reconciliationExceptions() {
    return [];
  }

  async auditLogs(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 50, 100);
    const [items, total] = await Promise.all([
      this.prisma.outboxMessage.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.outboxMessage.count(),
    ]);
    return {
      items: items.map((item) => ({
        id: item.id,
        actorId: 'system',
        actorName: 'system',
        action: item.eventType,
        resourceType: 'outbox',
        resourceId: item.id,
        detail: JSON.stringify(item.payload),
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }
}
