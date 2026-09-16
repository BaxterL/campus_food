/**
 * 集中 API 路径 — 后端路由变更时只改此文件
 * Base: VITE_API_BASE_URL (默认 /api/v1)
 */
export const API_PATHS = {
  auth: {
    me: '/ops/auth/me',
    devLogin: '/ops/auth/dev-login',
  },
  overview: {
    stats: '/ops/overview/stats',
  },
  merchants: {
    list: '/ops/merchants',
    detail: (id: string) => `/ops/merchants/${id}`,
    approve: (id: string) => `/ops/merchants/${id}/approve`,
    reject: (id: string) => `/ops/merchants/${id}/reject`,
    toggleStatus: (id: string) => `/ops/merchants/${id}/toggle-status`,
  },
  products: {
    list: '/ops/products',
    inventory: (id: string) => `/ops/products/${id}/inventory`,
  },
  orders: {
    list: '/ops/orders',
    detail: (id: string) => `/ops/orders/${id}`,
    accept: (id: string) => `/ops/orders/${id}/accept`,
    reject: (id: string) => `/ops/orders/${id}/reject`,
    markReady: (id: string) => `/ops/orders/${id}/mark-ready`,
  },
  dispatch: {
    pending: '/ops/dispatch/pending',
    riders: '/ops/dispatch/riders',
    assign: '/ops/dispatch/assign',
    reassign: '/ops/dispatch/reassign',
  },
  riders: {
    whitelist: '/ops/riders/whitelist',
    whitelistItem: (id: string) => `/ops/riders/whitelist/${id}`,
  },
  finance: {
    refundExceptions: '/ops/finance/refund-exceptions',
    reconciliationExceptions: '/ops/finance/reconciliation-exceptions',
  },
  audit: {
    logs: '/ops/audit-logs',
  },
} as const;
