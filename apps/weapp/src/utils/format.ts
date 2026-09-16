export function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
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
