<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!task" class="empty">任务不存在</view>
    <view v-else>
      <view class="card">
        <view class="row-between">
          <text class="title">{{ task.orderNo }}</text>
          <text class="tag">{{ statusLabel(task.status) }}</text>
        </view>
        <text class="muted">商家：{{ task.merchantName }}</text>
        <text class="muted">地址：{{ task.merchantAddress }}</text>
        <text class="muted">送达：{{ task.deliveryAddress }}</text>
      </view>

      <view v-if="task.status === 'PENDING'" class="card">
        <button class="btn-primary" :loading="acting" @tap="accept">接受任务</button>
      </view>

      <view v-if="task.status === 'ACCEPTED' || task.status === 'AT_STORE'" class="card">
        <button
          v-if="task.status === 'ACCEPTED'"
          class="btn-outline"
          :loading="acting"
          @tap="arrive"
        >
          确认到店
        </button>
        <text class="section">输入取餐码</text>
        <input v-model="pickupCode" class="input" placeholder="向商家索取取餐码" />
        <!-- #ifdef MP-WEIXIN -->
        <button class="btn-outline" style="margin-top: 12rpx" @tap="scanPickup">扫码取餐码</button>
        <!-- #endif -->
        <button class="btn-primary" style="margin-top: 16rpx" :loading="acting" @tap="confirmPickup">
          确认取餐
        </button>
      </view>

      <view v-if="task.status === 'PICKED_UP'" class="card">
        <text class="section">输入送达码</text>
        <input v-model="deliveryCode" class="input" placeholder="向用户确认送达码" />
        <button class="btn-primary" style="margin-top: 16rpx" :loading="acting" @tap="confirmDelivery">
          确认送达
        </button>
      </view>

    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { scanCode } from '@/platform/wechat';
import { riderApi } from '@/services/api';
import type { RiderTask } from '@/services/api/types';
import { requireRole } from '@/utils/guard';

const taskId = ref('');
const task = ref<RiderTask | null>(null);
const loading = ref(false);
const acting = ref(false);
const pickupCode = ref('');
const deliveryCode = ref('');

const statusMap: Record<string, string> = {
  PENDING: '待接单',
  ACCEPTED: '已接单',
  AT_STORE: '已到店',
  PICKED_UP: '已取餐',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
};

onLoad((query) => {
  taskId.value = String(query?.id || '');
});

onShow(() => {
  if (!requireRole('rider')) return;
  if (taskId.value) loadTask();
});

async function loadTask() {
  loading.value = true;
  try {
    task.value = await riderApi.getTask(taskId.value);
  } catch {
    task.value = null;
  } finally {
    loading.value = false;
  }
}

function statusLabel(status: string) {
  return statusMap[status] || status;
}

async function accept() {
  acting.value = true;
  try {
    task.value = await riderApi.acceptTask(taskId.value);
    uni.showToast({ title: '已接单', icon: 'success' });
  } finally {
    acting.value = false;
  }
}

async function arrive() {
  acting.value = true;
  try {
    task.value = await riderApi.arriveStore(taskId.value);
    uni.showToast({ title: '已到店', icon: 'success' });
  } finally {
    acting.value = false;
  }
}

async function scanPickup() {
  try {
    pickupCode.value = await scanCode();
  } catch (e) {
    const msg = e instanceof Error ? e.message : '扫码失败';
    uni.showToast({ title: msg, icon: 'none' });
  }
}

async function confirmPickup() {
  if (!pickupCode.value.trim()) {
    uni.showToast({ title: '请输入取餐码', icon: 'none' });
    return;
  }
  acting.value = true;
  try {
    task.value = await riderApi.confirmPickup(taskId.value, pickupCode.value.trim());
    uni.showToast({ title: '取餐成功', icon: 'success' });
  } finally {
    acting.value = false;
  }
}

async function confirmDelivery() {
  if (!deliveryCode.value.trim()) {
    uni.showToast({ title: '请输入送达码', icon: 'none' });
    return;
  }
  acting.value = true;
  try {
    task.value = await riderApi.confirmDelivery(taskId.value, deliveryCode.value.trim());
    uni.showToast({ title: '送达完成', icon: 'success' });
  } finally {
    acting.value = false;
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

.input {
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  padding: 20rpx;
}
</style>
