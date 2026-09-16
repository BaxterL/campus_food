<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="orders.length === 0" class="empty">暂无待处理订单</view>
    <view v-else>
      <view v-for="order in orders" :key="order.id" class="card">
        <view class="row-between">
          <text class="no">{{ order.orderNo }}</text>
          <text class="tag">{{ statusLabel(order.status) }}</text>
        </view>
        <view v-for="item in order.items" :key="item.productId" class="muted item">
          {{ item.productName }} x{{ item.quantity }}
        </view>
        <text class="muted">{{ formatDateTime(order.createdAt) }}</text>
        <view v-if="order.pickupCode" class="muted">取餐码：{{ order.pickupCode }}</view>
        <view class="actions">
          <button
            v-if="order.status === 'MERCHANT_PENDING'"
            class="btn-primary mini"
            size="mini"
            @tap="accept(order.id)"
          >
            接单
          </button>
          <button
            v-if="order.status === 'MERCHANT_PENDING'"
            class="btn-danger mini"
            size="mini"
            @tap="reject(order.id)"
          >
            拒单
          </button>
          <button
            v-if="order.status === 'ACCEPTED' || order.status === 'PREPARING'"
            class="btn-primary mini"
            size="mini"
            @tap="ready(order.id)"
          >
            出餐完成
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { merchantApi } from '@/services/api';
import type { Order } from '@/services/api/types';
import { formatDateTime, ORDER_STATUS_LABEL } from '@/utils/format';

const orders = ref<Order[]>([]);
const loading = ref(false);

onShow(() => {
  loadOrders();
});

async function loadOrders() {
  loading.value = true;
  try {
    orders.value = await merchantApi.listOrders();
  } catch {
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

function statusLabel(status: string) {
  return ORDER_STATUS_LABEL[status] || status;
}

async function accept(id: string) {
  await merchantApi.acceptOrder(id);
  uni.showToast({ title: '已接单', icon: 'success' });
  loadOrders();
}

async function reject(id: string) {
  uni.showModal({
    title: '拒单',
    editable: true,
    placeholderText: '拒单原因（选填）',
    success: async (res) => {
      if (!res.confirm) return;
      await merchantApi.rejectOrder(id, res.content);
      uni.showToast({ title: '已拒单', icon: 'none' });
      loadOrders();
    },
  });
}

async function ready(id: string) {
  await merchantApi.markReady(id);
  uni.showToast({ title: '已出餐', icon: 'success' });
  loadOrders();
}
</script>

<style scoped lang="scss">
.no {
  font-weight: 600;
}

.item {
  display: block;
  margin: 4rpx 0;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
</style>
