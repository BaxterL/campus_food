<template>
  <view class="container">
    <view class="card">
      <view class="row-between">
        <text class="title">骑手值班</text>
        <text :class="['tag', duty?.onDuty ? 'tag-open' : 'tag-closed']">
          {{ duty?.onDuty ? '值班中' : '未值班' }}
        </text>
      </view>
      <text v-if="duty?.onDuty && duty.since" class="muted">自 {{ formatDateTime(duty.since) }}</text>
      <view class="actions">
        <button
          v-if="!duty?.onDuty"
          class="btn-primary"
          :loading="loading"
          @tap="startDuty"
        >
          开始值班
        </button>
        <button v-else class="btn-outline" :loading="loading" @tap="endDuty">结束值班</button>
      </view>
    </view>

    <view class="card entry" @tap="goTasks">
      <text class="entry-title">配送任务</text>
      <text class="muted">接单、到店、取餐码、送达码</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { riderApi } from '@/services/api';
import type { RiderDuty } from '@/services/api/types';
import { useSessionStore } from '@/stores/session';
import { formatDateTime } from '@/utils/format';

const session = useSessionStore();
const duty = ref<RiderDuty | null>(null);
const loading = ref(false);

onShow(() => {
  if (!session.hasRole('rider')) {
    uni.showToast({ title: '无骑手权限', icon: 'none' });
    return;
  }
  loadDuty();
});

async function loadDuty() {
  try {
    duty.value = await riderApi.getDuty();
  } catch {
    duty.value = { onDuty: false };
  }
}

async function startDuty() {
  loading.value = true;
  try {
    duty.value = await riderApi.startDuty();
    uni.showToast({ title: '已开始值班', icon: 'success' });
  } finally {
    loading.value = false;
  }
}

async function endDuty() {
  loading.value = true;
  try {
    duty.value = await riderApi.endDuty();
    uni.showToast({ title: '已结束值班', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goTasks() {
  uni.navigateTo({ url: '/pages/rider/tasks' });
}
</script>

<style scoped lang="scss">
.title {
  font-size: 34rpx;
  font-weight: 600;
}

.actions {
  margin-top: 24rpx;
}

.entry-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
</style>
