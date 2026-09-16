export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const roles = [
  'PLATFORM_ADMIN',
  'DISPATCHER',
  'MERCHANT_OWNER',
  'MERCHANT_STAFF',
  'RIDER',
  'CUSTOMER',
] as const;

export type Role = (typeof roles)[number];

export const paymentProviders = [
  'MOCK',
  'OFFLINE_MERCHANT_DIRECT',
  'WECHAT_SERVICE_PROVIDER',
  'WECHAT_PLATFORM',
] as const;

export type PaymentProviderName = (typeof paymentProviders)[number];
