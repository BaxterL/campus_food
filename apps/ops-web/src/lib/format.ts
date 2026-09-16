import dayjs from 'dayjs';

export function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export function formatDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  merchant_pending: '待接单',
  accepted: '已接单',
  rejected: '已拒单',
  preparing: '制作中',
  ready: '待取餐/待派单',
  dispatch_pending: '待派单',
  dispatched: '已派单',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
};

export const MERCHANT_REVIEW_LABEL: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

export const MERCHANT_RUN_LABEL: Record<string, string> = {
  active: '营业中',
  inactive: '已停用',
};

export const ROLE_LABEL: Record<string, string> = {
  platform_admin: '平台管理员',
  campus_ops: '校区运营',
  merchant_staff: '商家店员',
  rider: '骑手',
};
