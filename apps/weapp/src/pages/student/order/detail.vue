<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!order" class="empty">订单不存在</view>
    <view v-else>
      <view class="card">
        <view class="row-between">
          <text class="title">{{ order.merchantName }}</text>
          <text class="tag">{{ statusLabel(order.status) }}</text>
        </view>
        <text class="muted">订单号 {{ order.orderNo }}</text>
        <text class="muted">支付：{{ paymentLabel(order.paymentStatus) }}</text>
        <text v-if="order.deliveryStatus && order.deliveryStatus !== 'NONE'" class="muted">
          配送：{{ deliveryLabel(order.deliveryStatus) }}
        </text>
        <text v-if="order.fulfillmentType === 'PICKUP'" class="muted">履约：到店自取</text>
        <text v-else-if="order.addressSnapshot" class="muted">送达：{{ order.addressSnapshot }}</text>
        <text v-if="order.paymentProvider === 'OFFLINE_MERCHANT_DIRECT'" class="notice-inline">
          本单为商家线下直收，请向商家当面支付
        </text>
      </view>

      <view class="card">
        <text class="section">商品</text>
        <view v-for="item in order.items" :key="item.productId" class="row-between item-row">
          <text>{{ item.productName }} x{{ item.quantity }}</text>
          <text>{{ formatCents(item.priceCents * item.quantity) }}</text>
        </view>
        <view class="row-between total-row">
          <text>合计</text>
          <text class="total">{{ formatCents(order.totalCents) }}</text>
        </view>
      </view>

      <view v-if="order.pickupCode" class="card">
        <text class="section">取餐码</text>
        <view class="code-box">{{ order.pickupCode }}</view>
        <text class="muted">向商家出示取餐码</text>
      </view>

      <view v-if="order.deliveryCode" class="card">
        <text class="section">送达码</text>
        <view class="code-box">{{ order.deliveryCode }}</view>
        <text class="muted">骑手送达时向您确认此码</text>
      </view>

      <view v-if="order.paymentStatus === 'UNPAID' && order.paymentProvider !== 'OFFLINE_MERCHANT_DIRECT'" class="card">
        <button class="btn-primary" :loading="paying" @tap="retryPay">继续支付</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Order } from '@/services/api/types';
import { payOrder } from '@/services/payment';
import { requireLogin } from '@/utils/guard';
import {
  DELIVERY_STATUS_LABEL,
  formatCents,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/utils/format';

const orderId = ref('');
const order = ref<Order | null>(null);
const loading = ref(false);
const paying = ref(false);

onLoad((query) => {
  orderId.value = String(query?.id || '');
});

onShow(() => {
  if (!requireLogin()) return;
  if (orderId.value) loadOrder();
});

async function loadOrder() {
  loading.value = true;
  try {
    order.value = await studentApi.getOrder(orderId.value);
  } catch {
    order.value = null;
  } finally {
    loading.value = false;
  }
}

function statusLabel(status: string) {
  return ORDER_STATUS_LABEL[status] || status;
}

function paymentLabel(status: string) {
  return PAYMENT_STATUS_LABEL[status] || status;
}

function deliveryLabel(status: string) {
  return DELIVERY_STATUS_LABEL[status] || status;
}

async function retryPay() {
  if (!order.value) return;
  paying.value = true;
  try {
    await payOrder(order.value.id);
    await loadOrder();
    uni.showToast({ title: '支付成功', icon: 'success' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '支付失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    paying.value = false;
  }
}
</script>

<style scoped lang="scss">
.title {
  font-size: 32rpx;
  font-weight: 600;
}

.section {
  display: block;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.item-row {
  padding: 8rpx 0;
}

.total-row {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #eee;
}

.total {
  color: #ee0a24;
  font-weight: bold;
}

.notice-inline {
  display: block;
  margin-top: 12rpx;
  color: #ad6800;
  font-size: 24rpx;
}
</style>
