import { API_BASE_URL } from '@/config';

export function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url) || url.startsWith('data:')) return url;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  MERCHANT_PENDING: '待商家接单',
  ACCEPTED: '商家已接单',
  REJECTED: '商家已拒单',
  PREPARING: '制作中',
  READY: '待取餐',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: '未支付',
  PENDING: '支付处理中',
  PAID: '已支付',
  REFUNDED: '已退款',
  FAILED: '支付失败',
};

export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  NONE: '无需配送',
  PENDING_DISPATCH: '待派单',
  DISPATCHED: '已派单',
  RIDER_ACCEPTED: '骑手已接单',
  PICKED_UP: '配送中',
  DELIVERED: '已送达',
  FAILED: '配送异常',
};
