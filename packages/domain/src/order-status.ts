import { DomainError } from './errors.js';

export enum OrderStatus {
  CREATED = 'CREATED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  MERCHANT_PENDING = 'MERCHANT_PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDING = 'REFUNDING',
  REFUNDED = 'REFUNDED',
}

export enum DeliveryStatus {
  NONE = 'NONE',
  PENDING_DISPATCH = 'PENDING_DISPATCH',
  DISPATCHED = 'DISPATCHED',
  RIDER_ACCEPTED = 'RIDER_ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.MERCHANT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.MERCHANT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.MERCHANT_PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = ORDER_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new DomainError(`Invalid order transition ${from} -> ${to}`, 'INVALID_ORDER_TRANSITION');
  }
}

export function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateDeliveryCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
