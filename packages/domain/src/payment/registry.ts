import { MockPaymentProvider } from './mock.provider.js';
import { OfflineMerchantDirectProvider } from './offline-merchant-direct.provider.js';
import { PaymentProvider, PaymentProviderType } from './types.js';

const providers = new Map<PaymentProviderType, PaymentProvider>([
  [PaymentProviderType.MOCK, new MockPaymentProvider()],
  [PaymentProviderType.OFFLINE_MERCHANT_DIRECT, new OfflineMerchantDirectProvider()],
]);

export function getPaymentProvider(type: PaymentProviderType): PaymentProvider {
  const provider = providers.get(type);
  if (!provider) {
    throw new Error(`Unknown payment provider: ${type}`);
  }
  return provider;
}
