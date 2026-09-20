<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="orders.length === 0" class="empty">暂无订单</view>
    <view v-else>
      <view v-for="order in orders" :key="order.id" class="card" @tap="goDetail(order.id)">
        <view class="row-between">
          <text class="shop">{{ order.merchantName }}</text>
          <text class="tag">{{ statusLabel(order.status) }}</text>
        </view>
        <text class="muted">{{ order.orderNo }}</text>
        <view class="row-between">
          <text>{{ formatDateTime(order.createdAt) }}</text>
          <text class="amount">{{ formatCents(order.totalCents) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Order } from '@/services/api/types';
import { formatCents, formatDateTime, ORDER_STATUS_LABEL } from '@/utils/format';
import { requireLogin } from '@/utils/guard';

const orders = ref<Order[]>([]);
const loading = ref(false);

onShow(() => {
  if (!requireLogin()) return;
  loadOrders();
});

async function loadOrders() {
  loading.value = true;
  try {
    orders.value = await studentApi.listOrders();
  } catch {
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

function statusLabel(status: string) {
  return ORDER_STATUS_LABEL[status] || status;
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/student/order/detail?id=${id}` });
}
</script>

<style scoped lang="scss">
.shop {
  font-weight: 600;
}

.amount {
  color: #ee0a24;
  font-weight: 600;
}
</style>
