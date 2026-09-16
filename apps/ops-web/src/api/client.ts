import { API_PATHS } from './paths';
import type {
  AssignDispatchInput,
  AuditLog,
  AuditLogQuery,
  AuthMe,
  DevIdentity,
  DispatchOrder,
  DispatchRider,
  Merchant,
  MerchantCreateInput,
  MerchantListQuery,
  MerchantUpdateInput,
  Order,
  OrderActionInput,
  OrderListQuery,
  OverviewStats,
  Paginated,
  Product,
  ProductInventoryUpdate,
  ProductListQuery,
  ReassignDispatchInput,
  ReconciliationException,
  RefundException,
  RiderWhitelistCreateInput,
  RiderWhitelistEntry,
  RiderWhitelistUpdateInput,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(status: number, body: { code?: string; message?: string; requestId?: string }) {
    super(body.message ?? `请求失败 (${status})`);
    this.name = 'ApiClientError';
    this.code = body.code ?? 'UNKNOWN';
    this.status = status;
    this.requestId = body.requestId;
  }
}

type IdentityGetter = () => DevIdentity | null;

let identityGetter: IdentityGetter = () => null;

export function setIdentityGetter(getter: IdentityGetter) {
  identityGetter = getter;
}

function buildQuery(params?: object): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  path: string,
  options: RequestInit & { query?: object } = {},
): Promise<T> {
  const { query, ...init } = options;
  const identity = identityGetter();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (identity) {
    headers.set('X-Dev-User-Id', identity.userId);
    headers.set('X-Dev-Role', identity.role);
    if (identity.campusId) headers.set('X-Dev-Campus-Id', identity.campusId);
    if (identity.merchantId) headers.set('X-Dev-Merchant-Id', identity.merchantId);
  }

  const url = `${BASE_URL}${path}${buildQuery(query)}`;
  const response = await fetch(url, { ...init, headers });

  if (response.status < 200 || response.status >= 300) {
    let body: { code?: string; message?: string; requestId?: string; error?: { code?: string; message?: string } } = {};
    try {
      body = (await response.json()) as typeof body;
    } catch {
      body = { message: response.statusText };
    }
    throw new ApiClientError(response.status, {
      code: body.code ?? body.error?.code,
      message: body.message ?? body.error?.message,
      requestId: body.requestId,
    });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ── Auth ──────────────────────────────────────────────

export const authApi = {
  me: () => request<AuthMe>(API_PATHS.auth.me),
  devLogin: (identity: DevIdentity) =>
    request<AuthMe>(API_PATHS.auth.devLogin, {
      method: 'POST',
      body: JSON.stringify(identity),
    }),
};

// ── Overview ──────────────────────────────────────────

export const overviewApi = {
  stats: () => request<OverviewStats>(API_PATHS.overview.stats),
};

// ── Merchants ─────────────────────────────────────────

export const merchantApi = {
  list: (query?: MerchantListQuery) =>
    request<Paginated<Merchant>>(API_PATHS.merchants.list, { query }),
  get: (id: string) => request<Merchant>(API_PATHS.merchants.detail(id)),
  create: (input: MerchantCreateInput) =>
    request<Merchant>(API_PATHS.merchants.list, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: MerchantUpdateInput) =>
    request<Merchant>(API_PATHS.merchants.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  approve: (id: string) =>
    request<Merchant>(API_PATHS.merchants.approve(id), { method: 'POST' }),
  reject: (id: string, reason?: string) =>
    request<Merchant>(API_PATHS.merchants.reject(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  toggleStatus: (id: string) =>
    request<Merchant>(API_PATHS.merchants.toggleStatus(id), { method: 'POST' }),
};

// ── Products ──────────────────────────────────────────

export const productApi = {
  list: (query?: ProductListQuery) =>
    request<Paginated<Product>>(API_PATHS.products.list, { query }),
  updateInventory: (id: string, input: ProductInventoryUpdate) =>
    request<Product>(API_PATHS.products.inventory(id), {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
};

// ── Orders ────────────────────────────────────────────

export const orderApi = {
  list: (query?: OrderListQuery) =>
    request<Paginated<Order>>(API_PATHS.orders.list, { query }),
  get: (id: string) => request<Order>(API_PATHS.orders.detail(id)),
  accept: (id: string, input?: OrderActionInput) =>
    request<Order>(API_PATHS.orders.accept(id), {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    }),
  reject: (id: string, input?: OrderActionInput) =>
    request<Order>(API_PATHS.orders.reject(id), {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    }),
  markReady: (id: string) =>
    request<Order>(API_PATHS.orders.markReady(id), { method: 'POST' }),
};

// ── Dispatch ────────────────────────────────────────────

export const dispatchApi = {
  pending: () => request<DispatchOrder[]>(API_PATHS.dispatch.pending),
  riders: () => request<DispatchRider[]>(API_PATHS.dispatch.riders),
  assign: (input: AssignDispatchInput) =>
    request<Order>(API_PATHS.dispatch.assign, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  reassign: (input: ReassignDispatchInput) =>
    request<Order>(API_PATHS.dispatch.reassign, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

// ── Riders ────────────────────────────────────────────

export const riderApi = {
  listWhitelist: (query?: { campusId?: string }) =>
    request<RiderWhitelistEntry[]>(API_PATHS.riders.whitelist, { query }),
  createWhitelist: (input: RiderWhitelistCreateInput) =>
    request<RiderWhitelistEntry>(API_PATHS.riders.whitelist, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateWhitelist: (id: string, input: RiderWhitelistUpdateInput) =>
    request<RiderWhitelistEntry>(API_PATHS.riders.whitelistItem(id), {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteWhitelist: (id: string) =>
    request<void>(API_PATHS.riders.whitelistItem(id), { method: 'DELETE' }),
};

// ── Finance ───────────────────────────────────────────

export const financeApi = {
  refundExceptions: () =>
    request<RefundException[]>(API_PATHS.finance.refundExceptions),
  reconciliationExceptions: () =>
    request<ReconciliationException[]>(API_PATHS.finance.reconciliationExceptions),
};

// ── Audit ───────────────────────────────────────────

export const auditApi = {
  list: (query?: AuditLogQuery) =>
    request<Paginated<AuditLog>>(API_PATHS.audit.logs, { query }),
};
