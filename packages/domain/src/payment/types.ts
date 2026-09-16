export enum PaymentProviderType {
  MOCK = 'MOCK',
  OFFLINE_MERCHANT_DIRECT = 'OFFLINE_MERCHANT_DIRECT',
}

export interface PaymentRequest {
  orderId: string;
  orderNo: string;
  amountCents: number;
  userId: string;
  merchantId: string;
}

export interface PaymentResult {
  success: boolean;
  providerRef?: string;
  errorMessage?: string;
}

export interface RefundRequest {
  orderId: string;
  paymentProviderRef?: string;
  amountCents: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  providerRef?: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly type: PaymentProviderType;
  createPayment(req: PaymentRequest): Promise<PaymentResult>;
  createRefund(req: RefundRequest): Promise<RefundResult>;
}
