import { describe, expect, it } from 'vitest';
import { assertOrderTransition, OrderStatus } from './order-status.js';
import { DomainError } from './errors.js';

describe('order status transitions', () => {
  it('allows valid transitions', () => {
    expect(() => assertOrderTransition(OrderStatus.CREATED, OrderStatus.PENDING_PAYMENT)).not.toThrow();
    expect(() => assertOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.MERCHANT_PENDING)).not.toThrow();
    expect(() => assertOrderTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    expect(() => assertOrderTransition(OrderStatus.COMPLETED, OrderStatus.PAID)).toThrow(DomainError);
    expect(() => assertOrderTransition(OrderStatus.REJECTED, OrderStatus.ACCEPTED)).toThrow(DomainError);
  });
});
