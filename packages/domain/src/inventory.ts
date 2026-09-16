import { InsufficientInventoryError } from './errors.js';

export interface InventorySnapshot {
  skuId: string;
  totalQty: number;
  reservedQty: number;
}

export function availableQty(inv: InventorySnapshot): number {
  return inv.totalQty - inv.reservedQty;
}

export function assertCanReserve(inv: InventorySnapshot, qty: number): void {
  if (qty <= 0) {
    throw new Error('Reservation qty must be positive');
  }
  if (availableQty(inv) < qty) {
    throw new InsufficientInventoryError(inv.skuId);
  }
}

export function reserveQty(inv: InventorySnapshot, qty: number): InventorySnapshot {
  assertCanReserve(inv, qty);
  return { ...inv, reservedQty: inv.reservedQty + qty };
}

export function commitReservation(inv: InventorySnapshot, qty: number): InventorySnapshot {
  if (inv.reservedQty < qty || inv.totalQty < qty) {
    throw new InsufficientInventoryError(inv.skuId);
  }
  return {
    ...inv,
    totalQty: inv.totalQty - qty,
    reservedQty: inv.reservedQty - qty,
  };
}

export function releaseReservation(inv: InventorySnapshot, qty: number): InventorySnapshot {
  return {
    ...inv,
    reservedQty: Math.max(0, inv.reservedQty - qty),
  };
}
