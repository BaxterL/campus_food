import { http } from '@/services/http';
import type {
  Address,
  Building,
  Merchant,
  Order,
  PaymentIntent,
  PaymentProvider,
  PaymentStatus,
  Product,
} from '@/services/api/types';

export interface CreateOrderPayload {
  merchantId: string;
  fulfillmentType?: 'PICKUP' | 'RIDER_DELIVERY' | 'MERCHANT_DELIVERY';
  addressId?: string;
  items: Array<{ productId: string; skuId?: string; quantity: number }>;
  remark?: string;
  idempotencyKey: string;
  paymentProvider: PaymentProvider;
}

export interface CreateAddressPayload {
  buildingId: string;
  room: string;
  contactName: string;
  contactPhone: string;
  isDefault?: boolean;
}

export const studentApi = {
  listMerchants() {
    return http.get<Merchant[]>('/merchants');
  },

  getMerchant(merchantId: string) {
    return http.get<Merchant>(`/merchants/${merchantId}`);
  },

  listProducts(merchantId: string) {
    return http.get<Product[]>(`/merchants/${merchantId}/products`);
  },

  listBuildings() {
    return http.get<Building[]>('/buildings');
  },

  listAddresses() {
    return http.get<Address[]>('/addresses');
  },

  createAddress(payload: CreateAddressPayload) {
    return http.post<Address>('/addresses', payload);
  },

  updateAddress(id: string, payload: Partial<CreateAddressPayload>) {
    return http.put<Address>(`/addresses/${id}`, payload);
  },

  deleteAddress(id: string) {
    return http.delete<void>(`/addresses/${id}`);
  },

  createOrder(payload: CreateOrderPayload) {
    return http.post<Order>('/orders', payload);
  },

  listOrders(status?: string) {
    return http.get<Order[]>('/orders', status ? { status } : undefined);
  },

  getOrder(orderId: string) {
    return http.get<Order>(`/orders/${orderId}`);
  },

  createPayment(orderId: string, provider: PaymentProvider = 'MOCK') {
    return http.post<PaymentIntent>(`/orders/${orderId}/payments`, { provider });
  },

  getPaymentStatus(orderId: string) {
    return http.get<{ status: PaymentStatus }>(`/orders/${orderId}/payment-status`);
  },
};
