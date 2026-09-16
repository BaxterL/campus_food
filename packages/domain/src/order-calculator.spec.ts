import { describe, expect, it } from 'vitest';
import { calculateOrder } from './order-calculator.js';
import { DomainError } from './errors.js';

describe('calculateOrder', () => {
  it('calculates subtotal and total in cents', () => {
    const result = calculateOrder({
      lines: [
        { skuId: 's1', productName: '面', skuName: '大碗', unitPriceCents: 1500, qty: 2 },
        { skuId: 's2', productName: '蛋', skuName: '卤蛋', unitPriceCents: 300, qty: 1 },
      ],
      deliveryFeeCents: 200,
    });

    expect(result.subtotalCents).toBe(3300);
    expect(result.deliveryFeeCents).toBe(200);
    expect(result.totalCents).toBe(3500);
    expect(result.items[0]?.totalCents).toBe(3000);
  });

  it('rejects empty order', () => {
    expect(() => calculateOrder({ lines: [] })).toThrow(DomainError);
  });
});
