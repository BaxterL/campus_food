<template>
  <view class="container">
    <view v-if="merchant" class="card">
      <view class="row-between">
        <text class="title">{{ merchant.name }}</text>
        <text :class="['tag', merchant.isOpen ? 'tag-open' : 'tag-closed']">
          {{ merchant.isOpen ? '营业中' : '休息中' }}
        </text>
      </view>
      <view class="row-between switch-row">
        <text>营业开关</text>
        <switch :checked="merchant.isOpen" :disabled="toggling" @change="toggleOpen" />
      </view>
    </view>

    <view class="card entry" @tap="goOrders">
      <text class="entry-title">订单管理</text>
      <text class="muted">接单 / 拒单 / 出餐</text>
    </view>
    <view class="card entry" @tap="goProducts">
      <text class="entry-title">商品管理</text>
      <text class="muted">售罄开关</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { merchantApi } from '@/services/api';
import type { Merchant } from '@/services/api/types';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const merchant = ref<Merchant | null>(null);
const toggling = ref(false);

onShow(() => {
  if (!session.hasRole('merchant')) {
    uni.showToast({ title: '无商家权限', icon: 'none' });
    return;
  }
  loadProfile();
});

async function loadProfile() {
  try {
    merchant.value = await merchantApi.getProfile();
  } catch {
    merchant.value = null;
  }
}

async function toggleOpen(e: { detail: { value: boolean } }) {
  toggling.value = true;
  try {
    merchant.value = await merchantApi.updateOpenStatus(e.detail.value);
    uni.showToast({ title: e.detail.value ? '已开始营业' : '已休息', icon: 'none' });
  } catch {
    await loadProfile();
  } finally {
    toggling.value = false;
  }
}

function goOrders() {
  uni.navigateTo({ url: '/pages/merchant/orders' });
}

function goProducts() {
  uni.navigateTo({ url: '/pages/merchant/products' });
}
</script>

<style scoped lang="scss">
.title {
  font-size: 34rpx;
  font-weight: 600;
}

.switch-row {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #eee;
}

.entry-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
</style>
