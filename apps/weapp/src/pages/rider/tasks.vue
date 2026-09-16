<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="tasks.length === 0" class="empty">暂无任务</view>
    <view v-else>
      <view v-for="task in tasks" :key="task.id" class="card" @tap="goDetail(task.id)">
        <view class="row-between">
          <text class="no">{{ task.orderNo }}</text>
          <text class="tag">{{ statusLabel(task.status) }}</text>
        </view>
        <text class="muted">{{ task.merchantName }}</text>
        <text class="muted">送至：{{ task.deliveryAddress }}</text>
        <text class="amount">{{ formatCents(task.totalCents) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { riderApi } from '@/services/api';
import type { RiderTask } from '@/services/api/types';
import { formatCents } from '@/utils/format';

const tasks = ref<RiderTask[]>([]);
const loading = ref(false);

const statusMap: Record<string, string> = {
  PENDING: '待接单',
  ACCEPTED: '已接单',
  AT_STORE: '已到店',
  PICKED_UP: '已取餐',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
};

onShow(() => {
  loadTasks();
});

async function loadTasks() {
  loading.value = true;
  try {
    tasks.value = await riderApi.listTasks();
  } catch {
    tasks.value = [];
  } finally {
    loading.value = false;
  }
}

function statusLabel(status: string) {
  return statusMap[status] || status;
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/rider/task-detail?id=${id}` });
}
</script>

<style scoped lang="scss">
.no {
  font-weight: 600;
}

.amount {
  display: block;
  margin-top: 8rpx;
  color: #ee0a24;
  font-weight: 600;
}
</style>
