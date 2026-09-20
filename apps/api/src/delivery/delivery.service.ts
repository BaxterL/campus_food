import { Injectable } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '@campus-food/domain';
import { DeliveryStatus, FulfillmentType, OrderStatus } from '@prisma/client';
import { resolveCampusId } from '../common/default-campus.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import {
  AssignDispatchDto,
  CreateRiderDto,
  CreateRiderDutyDto,
  ReassignDispatchDto,
  SetRiderActiveDto,
} from './delivery.dto.js';
import { toRiderTask } from '../common/weapp-presenters.js';

const DISPATCH_INCLUDE = {
  order: { include: { items: true, merchant: true, address: { include: { building: true } } } },
} as const;

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  createRider(dto: CreateRiderDto) {
    const { campusId, ...rest } = dto;
    return this.prisma.rider.create({ data: { ...rest, campusId: resolveCampusId(campusId) } });
  }

  listRiders(campusId?: string) {
    return this.prisma.rider.findMany({
      where: { active: true, ...(campusId ? { campusId } : {}) },
      include: { duties: true, user: true },
    });
  }

  async setRiderActive(riderId: string, dto: SetRiderActiveDto) {
    const rider = await this.prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) throw new NotFoundError('Rider');
    return this.prisma.rider.update({ where: { id: riderId }, data: { active: dto.active } });
  }

  createDuty(dto: CreateRiderDutyDto) {
    return this.prisma.riderDuty.create({
      data: {
        riderId: dto.riderId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async assignDispatch(ctx: RequestContext, dto: AssignDispatchDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.fulfillmentType !== FulfillmentType.RIDER_DELIVERY) {
      throw new ConflictError('Order is not rider delivery');
    }

    const rider = await this.prisma.rider.findUnique({ where: { userId: dto.riderId } });
    if (!rider || !rider.active) {
      throw new ForbiddenError('Rider not in whitelist or inactive');
    }

    const dispatch = await this.prisma.dispatch.upsert({
      where: { orderId: dto.orderId },
      update: { riderId: dto.riderId, assignedBy: ctx.userId, assignedAt: new Date() },
      create: {
        orderId: dto.orderId,
        riderId: dto.riderId,
        assignedBy: ctx.userId,
        assignedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: { deliveryStatus: DeliveryStatus.DISPATCHED },
    });

    await this.prisma.outboxMessage.create({
      data: { eventType: 'dispatch.assigned', payload: { orderId: dto.orderId, riderId: dto.riderId } },
    });

    return dispatch;
  }

  async reassignDispatch(ctx: RequestContext, orderId: string, dto: ReassignDispatchDto) {
    const dispatch = await this.prisma.dispatch.findUnique({ where: { orderId } });
    if (!dispatch) throw new NotFoundError('Dispatch');

    const rider = await this.prisma.rider.findUnique({ where: { userId: dto.riderId } });
    if (!rider || !rider.active) throw new ForbiddenError('Rider not in whitelist');

    const updated = await this.prisma.dispatch.update({
      where: { orderId },
      data: { riderId: dto.riderId, assignedBy: ctx.userId, assignedAt: new Date(), acceptedAt: null },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryStatus: DeliveryStatus.DISPATCHED },
    });

    return updated;
  }

  async riderAccept(ctx: RequestContext, orderId: string) {
    const dispatch = await this.getDispatch(ctx, orderId);
    await this.prisma.dispatch.update({
      where: { id: dispatch.id },
      data: { acceptedAt: new Date() },
    });
    await this.prisma.order.update({
      where: { id: dispatch.orderId },
      data: { deliveryStatus: DeliveryStatus.RIDER_ACCEPTED },
    });
    return this.toTask(ctx, dispatch.orderId);
  }

  async riderPickup(ctx: RequestContext, orderId: string, pickupCode: string) {
    const dispatch = await this.getDispatch(ctx, orderId);
    const order = await this.prisma.order.findUnique({ where: { id: dispatch.orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.pickupCode !== pickupCode) throw new ConflictError('Invalid pickup code');
    if (order.status !== OrderStatus.READY) throw new ConflictError('Order not ready');

    await this.prisma.dispatch.update({
      where: { id: dispatch.id },
      data: { pickedUpAt: new Date() },
    });
    await this.prisma.order.update({
      where: { id: dispatch.orderId },
      data: { deliveryStatus: DeliveryStatus.PICKED_UP },
    });
    return this.toTask(ctx, dispatch.orderId);
  }

  async listMyDispatches(ctx: RequestContext) {
    const rows = await this.prisma.dispatch.findMany({
      where: { riderId: ctx.userId },
      include: DISPATCH_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toRiderTask(row));
  }

  async getDispatch(ctx: RequestContext, orderId: string) {
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { OR: [{ orderId }, { id: orderId }], riderId: ctx.userId },
      include: DISPATCH_INCLUDE,
    });
    if (!dispatch) throw new NotFoundError('Dispatch');
    return dispatch;
  }

  async getTask(ctx: RequestContext, orderId: string) {
    return this.toTask(ctx, orderId);
  }

  private async toTask(ctx: RequestContext, orderId: string) {
    const dispatch = await this.getDispatch(ctx, orderId);
    return toRiderTask(dispatch);
  }

  async riderArrive(ctx: RequestContext, orderId: string) {
    const dispatch = await this.getDispatch(ctx, orderId);
    await this.prisma.dispatch.update({
      where: { id: dispatch.id },
      data: { arrivedAt: new Date(), acceptedAt: dispatch.acceptedAt ?? new Date() },
    });
    await this.prisma.order.update({
      where: { id: dispatch.orderId },
      data: { deliveryStatus: DeliveryStatus.RIDER_ACCEPTED },
    });
    return this.toTask(ctx, dispatch.orderId);
  }

  async getDuty(ctx: RequestContext) {
    const rider = await this.prisma.rider.findUnique({ where: { userId: ctx.userId }, include: { duties: true } });
    if (!rider) throw new NotFoundError('Rider');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const duty = rider.duties.find((d) => d.date.getTime() === today.getTime() && d.active);
    return { onDuty: Boolean(duty), since: duty?.startTime };
  }

  async setDuty(ctx: RequestContext, onDuty: boolean) {
    const rider = await this.prisma.rider.findUnique({ where: { userId: ctx.userId } });
    if (!rider || !rider.active) throw new ForbiddenError('Rider not in whitelist');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.prisma.riderDuty.upsert({
      where: { riderId_date: { riderId: rider.id, date: today } },
      update: { active: onDuty, startTime: onDuty ? '00:00' : '00:00', endTime: '23:59' },
      create: {
        riderId: rider.id,
        date: today,
        startTime: '00:00',
        endTime: '23:59',
        active: onDuty,
      },
    });
    return this.getDuty(ctx);
  }
}
