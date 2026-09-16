import {
  PaymentProvider,
  PaymentProviderType,
  PaymentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
} from './types.js';

/** Offline direct payment — merchant collects payment outside the platform. */
export class OfflineMerchantDirectProvider implements PaymentProvider {
  readonly type = PaymentProviderType.OFFLINE_MERCHANT_DIRECT;

  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      providerRef: `offline_${req.merchantId}_${req.orderNo}`,
    };
  }

  async createRefund(req: RefundRequest): Promise<RefundResult> {
    return {
      success: true,
      providerRef: `offline_refund_${req.orderId}`,
    };
  }
}
