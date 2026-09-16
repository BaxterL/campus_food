import { describe, expect, it } from 'vitest';
import { assertCanReserve, availableQty, commitReservation, releaseReservation, reserveQty } from './inventory.js';
import { InsufficientInventoryError } from './errors.js';

describe('inventory', () => {
  const inv = { skuId: 'sku1', totalQty: 10, reservedQty: 2 };

  it('computes available qty', () => {
    expect(availableQty(inv)).toBe(8);
  });

  it('reserves and commits', () => {
    const reserved = reserveQty(inv, 3);
    expect(reserved.reservedQty).toBe(5);
    const committed = commitReservation(reserved, 3);
    expect(committed.totalQty).toBe(7);
    expect(committed.reservedQty).toBe(2);
  });

  it('releases reservation', () => {
    const released = releaseReservation(inv, 2);
    expect(released.reservedQty).toBe(0);
  });

  it('throws on insufficient inventory', () => {
    expect(() => assertCanReserve(inv, 20)).toThrow(InsufficientInventoryError);
  });
});
