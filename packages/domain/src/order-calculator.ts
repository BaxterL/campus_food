import { assertCents, multiplyCents, sumCents } from './money.js';
import { DomainError } from './errors.js';

export interface OrderLineInput {
  skuId: string;
  productName: string;
  skuName: string;
  unitPriceCents: number;
  qty: number;
}

export interface OrderLineResult {
  skuId: string;
  productName: string;
  skuName: string;
  unitPriceCents: number;
  qty: number;
  totalCents: number;
}

export interface OrderCalculationInput {
  lines: readonly OrderLineInput[];
  deliveryFeeCents?: number;
}

export interface OrderCalculationResult {
  items: OrderLineResult[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

export function calculateOrder(input: OrderCalculationInput): OrderCalculationResult {
  if (input.lines.length === 0) {
    throw new DomainError('Order must have at least one item', 'EMPTY_ORDER');
  }

  const deliveryFeeCents = input.deliveryFeeCents ?? 0;
  assertCents(deliveryFeeCents, 'deliveryFeeCents');

  const items: OrderLineResult[] = input.lines.map((line) => {
    assertCents(line.unitPriceCents, 'unitPriceCents');
    const totalCents = multiplyCents(line.unitPriceCents, line.qty);
    return {
      skuId: line.skuId,
      productName: line.productName,
      skuName: line.skuName,
      unitPriceCents: line.unitPriceCents,
      qty: line.qty,
      totalCents,
    };
  });

  const subtotalCents = sumCents(items.map((i) => i.totalCents));
  const totalCents = subtotalCents + deliveryFeeCents;

  return { items, subtotalCents, deliveryFeeCents, totalCents };
}
