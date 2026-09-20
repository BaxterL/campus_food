import {
  DeliveryStatus,
  FulfillmentType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    merchant: true;
    payment: true;
    address: { include: { building: true } };
  };
}>;

type DispatchWithOrder = Prisma.DispatchGetPayload<{
  include: {
    order: {
      include: {
        items: true;
        merchant: true;
        address: { include: { building: true } };
      };
    };
  };
}>;

export function toWeappOrder(order: {
  id: string;
  orderNo: string;
  merchantId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  fulfillmentType: FulfillmentType;
  totalCents: number;
  deliveryFeeCents: number;
  remark: string | null;
  pickupCode: string | null;
  deliveryCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  merchant?: { name: string } | null;
  payment?: { provider: PaymentProvider } | null;
  address?: { room: string; contact: string; phone: string; building?: { name: string } | null } | null;
  items: Array<{ skuId: string; productName: string; unitPriceCents: number; qty: number }>;
}) {
  const unpaid = order.status === OrderStatus.PENDING_PAYMENT && order.paymentStatus === PaymentStatus.PENDING;
  return {
    id: order.id,
    orderNo: order.orderNo,
    merchantId: order.merchantId,
    merchantName: order.merchant?.name ?? '',
    status: order.status,
    paymentStatus: unpaid ? 'UNPAID' : order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    fulfillmentType: order.fulfillmentType,
    paymentProvider: order.payment?.provider,
    items: order.items.map((item) => ({
      productId: item.skuId,
      productName: item.productName,
      priceCents: item.unitPriceCents,
      quantity: item.qty,
    })),
    totalCents: order.totalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    addressSnapshot: order.address
      ? `${order.address.building?.name ?? ''} ${order.address.room} ${order.address.contact} ${order.address.phone}`
      : undefined,
    pickupCode: order.pickupCode ?? undefined,
    deliveryCode: order.deliveryCode ?? undefined,
    remark: order.remark ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toWeappProduct(product: {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category?: { name: string } | null;
  skus: Array<{
    id: string;
    priceCents: number;
    inventory: { totalQty: number; reservedQty: number } | null;
  }>;
}) {
  const sku = product.skus[0];
  const available = sku?.inventory ? sku.inventory.totalQty - sku.inventory.reservedQty : 0;
  return {
    id: product.id,
    productId: product.id,
    skuId: sku?.id,
    merchantId: product.merchantId,
    name: product.name,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    priceCents: sku?.priceCents ?? 0,
    soldOut: !sku || available <= 0,
    categoryName: product.category?.name,
  };
}

export function toRiderTask(dispatch: DispatchWithOrder) {
  const order = dispatch.order;
  const address = order.address
    ? `${order.address.building?.name ?? ''} ${order.address.room}`
    : '';
  return {
    id: order.id,
    dispatchId: dispatch.id,
    orderId: order.id,
    orderNo: order.orderNo,
    merchantName: order.merchant.name,
    merchantAddress: order.merchant.address ?? '',
    deliveryAddress: address,
    status: riderTaskStatus(dispatch, order.status, order.deliveryStatus),
    pickupCode: order.pickupCode ?? undefined,
    deliveryCode: order.deliveryCode ?? undefined,
    totalCents: order.totalCents,
    createdAt: dispatch.createdAt.toISOString(),
  };
}

function riderTaskStatus(
  dispatch: { acceptedAt: Date | null; arrivedAt: Date | null; pickedUpAt: Date | null; deliveredAt: Date | null },
  orderStatus: OrderStatus,
  deliveryStatus: DeliveryStatus,
): 'PENDING' | 'ACCEPTED' | 'AT_STORE' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED' {
  if (orderStatus === OrderStatus.CANCELLED || orderStatus === OrderStatus.REJECTED) return 'CANCELLED';
  if (dispatch.deliveredAt || deliveryStatus === DeliveryStatus.DELIVERED || orderStatus === OrderStatus.COMPLETED) {
    return 'DELIVERED';
  }
  if (dispatch.pickedUpAt || deliveryStatus === DeliveryStatus.PICKED_UP) return 'PICKED_UP';
  if (dispatch.arrivedAt) return 'AT_STORE';
  if (dispatch.acceptedAt || deliveryStatus === DeliveryStatus.RIDER_ACCEPTED) return 'ACCEPTED';
  return 'PENDING';
}

export function toPaymentIntent(input: {
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
}) {
  return {
    orderId: input.orderId,
    provider: input.provider,
    status: input.status,
  };
}

export type { OrderWithRelations, DispatchWithOrder };
