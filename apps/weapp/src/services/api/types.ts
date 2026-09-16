export type Role = 'student' | 'merchant' | 'rider' | 'dispatcher' | 'admin';

export interface User {
  id: string;
  nickname: string;
  phone?: string;
  roles: Role[];
  merchantId?: string;
}

export interface Merchant {
  id: string;
  name: string;
  address: string;
  isOpen: boolean;
  notice?: string;
  minOrderCents: number;
  deliveryFeeCents: number;
  campusId?: string;
}

export interface Product {
  id: string;
  productId?: string;
  skuId?: string;
  merchantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceCents: number;
  soldOut: boolean;
  categoryName?: string;
}

export interface Building {
  id: string;
  name: string;
  campusId: string;
}

export interface Address {
  id: string;
  buildingId: string;
  buildingName: string;
  room: string;
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
}

export interface CartItem {
  productId: string;
  skuId?: string;
  productName: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'MERCHANT_PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type DeliveryStatus =
  | 'NONE'
  | 'PENDING_DISPATCH'
  | 'DISPATCHED'
  | 'RIDER_ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'FAILED';
export type PaymentProvider = 'MOCK' | 'OFFLINE_MERCHANT_DIRECT';

export interface Order {
  id: string;
  orderNo: string;
  merchantId: string;
  merchantName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  paymentProvider?: PaymentProvider;
  items: OrderItem[];
  totalCents: number;
  deliveryFeeCents: number;
  addressSnapshot?: string;
  pickupCode?: string;
  deliveryCode?: string;
  remark?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RiderTask {
  id: string;
  orderId: string;
  orderNo: string;
  merchantName: string;
  merchantAddress: string;
  deliveryAddress: string;
  status: 'PENDING' | 'ACCEPTED' | 'AT_STORE' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  pickupCode?: string;
  deliveryCode?: string;
  totalCents: number;
  createdAt: string;
}

export interface RiderDuty {
  onDuty: boolean;
  since?: string;
}

export interface PaymentIntent {
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  wechatPayParams?: WechatPayParams;
}

export interface WechatPayParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

export interface ApiEnvelope<T> {
  data: T;
  requestId?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
}

export class ApiError extends Error {
  code: string;
  requestId?: string;

  constructor(message: string, code = 'UNKNOWN', requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
  }
}
