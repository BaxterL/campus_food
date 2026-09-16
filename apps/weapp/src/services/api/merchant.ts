import { http } from '@/services/http';
import type { Merchant, Order, Product } from '@/services/api/types';

export const merchantApi = {
  getProfile() {
    return http.get<Merchant>('/merchant/profile');
  },

  updateOpenStatus(isOpen: boolean) {
    return http.patch<Merchant>('/merchant/profile', { isOpen });
  },

  listOrders(status?: string) {
    return http.get<Order[]>('/merchant/orders', status ? { status } : undefined);
  },

  acceptOrder(orderId: string) {
    return http.post<Order>(`/merchant/orders/${orderId}/accept`);
  },

  rejectOrder(orderId: string, reason?: string) {
    return http.post<Order>(`/merchant/orders/${orderId}/reject`, { reason });
  },

  markReady(orderId: string) {
    return http.post<Order>(`/merchant/orders/${orderId}/ready`);
  },

  listProducts() {
    return http.get<Product[]>('/merchant/products');
  },

  setSoldOut(productId: string, soldOut: boolean) {
    return http.patch<Product>(`/merchant/products/${productId}`, { soldOut });
  },
};
