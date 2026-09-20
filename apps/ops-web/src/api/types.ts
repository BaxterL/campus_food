/** 集中类型定义 — 后端接口变更时优先改此文件 */

export type OpsRole = 'platform_admin' | 'campus_ops' | 'merchant_staff' | 'rider';

export interface DevIdentity {
  userId: string;
  displayName: string;
  role: OpsRole;
  campusId?: string;
  merchantId?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  requestId?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

// ── Auth ──────────────────────────────────────────────

export interface AuthMe {
  userId: string;
  displayName: string;
  roles: OpsRole[];
  campusId?: string;
  merchantId?: string;
}

// ── Overview ──────────────────────────────────────────

export interface OverviewStats {
  todayOrders: number;
  todayRevenueCents: number;
  pendingMerchants: number;
  pendingDispatch: number;
  activeRiders: number;
  refundExceptions: number;
  scope?: 'merchant' | 'platform';
}

// ── Merchant ──────────────────────────────────────────

export type MerchantReviewStatus = 'pending' | 'approved' | 'rejected';
export type MerchantRunStatus = 'active' | 'inactive';

export interface Merchant {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  address: string;
  campusId: string;
  reviewStatus: MerchantReviewStatus;
  runStatus: MerchantRunStatus;
  licenseNo?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantCreateInput {
  name: string;
  contactName: string;
  contactPhone: string;
  address: string;
  licenseNo?: string;
  remark?: string;
}

export interface MerchantUpdateInput {
  name?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  licenseNo?: string;
  remark?: string;
}

export interface MerchantListQuery extends ListQuery {
  reviewStatus?: MerchantReviewStatus;
  runStatus?: MerchantRunStatus;
  campusId?: string;
}

// ── Product / Inventory ───────────────────────────────

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  productName?: string;
  imageUrl?: string;
  categoryName: string;
  skuCode: string;
  priceCents: number;
  stock: number;
  reservedStock: number;
  isOnSale: boolean;
  updatedAt: string;
}

export interface ProductCreateInput {
  merchantId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  skuName?: string;
  priceCents: number;
  stock?: number;
}

export interface CatalogCategory {
  id: string;
  merchantId: string;
  name: string;
}

export interface ProductInventoryUpdate {
  stock?: number;
  isOnSale?: boolean;
}

export interface ProductListQuery extends ListQuery {
  merchantId?: string;
  isOnSale?: boolean;
}

// ── Order ─────────────────────────────────────────────

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'merchant_pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready'
  | 'dispatch_pending'
  | 'dispatched'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  productName: string;
  skuCode: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  orderNo: string;
  merchantId: string;
  merchantName: string;
  fulfillmentType?: 'PICKUP' | 'MERCHANT_DELIVERY' | 'RIDER_DELIVERY';
  status: OrderStatus;
  totalCents: number;
  pickupCode?: string;
  deliveryCode?: string;
  riderId?: string;
  riderName?: string;
  customerPhone: string;
  buildingName: string;
  roomNo: string;
  remark?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListQuery extends ListQuery {
  status?: OrderStatus | OrderStatus[];
  merchantId?: string;
}

export interface OrderActionInput {
  reason?: string;
}

// ── Dispatch ────────────────────────────────────────

export type RiderDutyStatus = 'on_duty' | 'off_duty' | 'busy';

export interface DispatchOrder extends Order {
  waitMinutes: number;
}

export interface DispatchRider {
  id: string;
  name: string;
  phone: string;
  dutyStatus: RiderDutyStatus;
  activeOrders: number;
  campusId: string;
}

export interface AssignDispatchInput {
  orderId: string;
  riderId: string;
}

export interface ReassignDispatchInput {
  orderId: string;
  riderId: string;
  reason?: string;
}

// ── Rider whitelist ─────────────────────────────────

export interface RiderWhitelistEntry {
  id: string;
  name: string;
  phone: string;
  campusId: string;
  isActive: boolean;
  onDuty: boolean;
  createdAt: string;
}

export interface RiderWhitelistCreateInput {
  name: string;
  phone: string;
}

export interface RiderWhitelistUpdateInput {
  name?: string;
  phone?: string;
  isActive?: boolean;
}

// ── Finance ─────────────────────────────────────────

export type ExceptionStatus = 'open' | 'resolved' | 'ignored';

export interface RefundException {
  id: string;
  orderNo: string;
  refundNo: string;
  amountCents: number;
  reason: string;
  status: ExceptionStatus;
  createdAt: string;
}

export interface ReconciliationException {
  id: string;
  bizDate: string;
  channel: string;
  diffCents: number;
  summary: string;
  status: ExceptionStatus;
  createdAt: string;
}

// ── Audit ───────────────────────────────────────────

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

export interface AuditLogQuery extends ListQuery {
  actorId?: string;
  action?: string;
  resourceType?: string;
  from?: string;
  to?: string;
}
