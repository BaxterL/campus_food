import { assertCents } from './money.js';

export enum LedgerEntryType {
  ORDER_PAYMENT = 'ORDER_PAYMENT',
  ORDER_REFUND = 'ORDER_REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  MERCHANT_SETTLEMENT = 'MERCHANT_SETTLEMENT',
}

export interface LedgerEntryDraft {
  entryNo: string;
  type: LedgerEntryType;
  orderId?: string;
  userId?: string;
  merchantId?: string;
  amountCents: number;
  memo?: string;
  metadata?: Record<string, unknown>;
}

export function createPaymentEntry(
  entryNo: string,
  orderId: string,
  userId: string,
  amountCents: number,
): LedgerEntryDraft {
  assertCents(amountCents);
  return {
    entryNo,
    type: LedgerEntryType.ORDER_PAYMENT,
    orderId,
    userId,
    amountCents,
    memo: 'Order payment received',
  };
}

export function createRefundEntry(
  entryNo: string,
  orderId: string,
  userId: string,
  amountCents: number,
): LedgerEntryDraft {
  assertCents(amountCents);
  return {
    entryNo,
    type: LedgerEntryType.ORDER_REFUND,
    orderId,
    userId,
    amountCents: -amountCents,
    memo: 'Order refund issued',
  };
}
