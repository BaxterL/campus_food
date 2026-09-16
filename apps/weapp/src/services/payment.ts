import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_MAX_ATTEMPTS } from '@/config';
import { studentApi } from '@/services/api';
import type { PaymentIntent, PaymentProvider, PaymentStatus } from '@/services/api/types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 轮询服务端支付状态，不以微信前端回调为成功依据 */
export async function pollPaymentUntilSettled(
  orderId: string,
  maxAttempts = PAYMENT_POLL_MAX_ATTEMPTS,
): Promise<PaymentStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const { status } = await studentApi.getPaymentStatus(orderId);
    if (status === 'PAID' || status === 'FAILED' || status === 'REFUNDED') {
      return status;
    }
    await sleep(PAYMENT_POLL_INTERVAL_MS);
  }
  return 'PENDING';
}

/**
 * 发起支付并在服务端确认结果。
 * 微信支付的 success 回调后仍需轮询服务端。
 */
export async function payOrder(
  orderId: string,
  provider: PaymentProvider = 'MOCK',
): Promise<PaymentStatus> {
  const intent = await studentApi.createPayment(orderId, provider);

  if (intent.provider === 'OFFLINE_MERCHANT_DIRECT') {
    return intent.status;
  }

  if (intent.status === 'PAID') {
    return 'PAID';
  }

  const status = await pollPaymentUntilSettled(orderId);
  if (status !== 'PAID') {
    throw new Error('支付未完成');
  }
  return status;
}

export function isOfflineMerchantDirect(intent: PaymentIntent): boolean {
  return intent.provider === 'OFFLINE_MERCHANT_DIRECT';
}
