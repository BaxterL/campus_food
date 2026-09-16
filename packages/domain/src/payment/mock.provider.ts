import {
  PaymentProvider,
  PaymentProviderType,
  PaymentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
} from './types.js';

export class MockPaymentProvider implements PaymentProvider {
  readonly type = PaymentProviderType.MOCK;

  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      providerRef: `mock_pay_${req.orderId}_${Date.now()}`,
    };
  }

  async createRefund(req: RefundRequest): Promise<RefundResult> {
    return {
      success: true,
      providerRef: `mock_refund_${req.orderId}_${Date.now()}`,
    };
  }
}
