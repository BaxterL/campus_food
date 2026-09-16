export type Cents = number;

export function assertCents(value: number, field = 'amount'): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer (cents)`);
  }
}

export function sumCents(values: readonly number[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}

export function multiplyCents(unitPriceCents: Cents, qty: number): Cents {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error('qty must be a positive integer');
  }
  return unitPriceCents * qty;
}
