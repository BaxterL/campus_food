<template>
  <view class="container">
    <view class="toolbar row-between">
      <text class="muted">选择店铺</text>
      <text class="link" @tap="goOrders">我的订单</text>
    </view>

    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="merchants.length === 0" class="empty">暂无店铺</view>
    <view v-else>
      <view
        v-for="item in merchants"
        :key="item.id"
        class="card shop-card"
        @tap="goDetail(item.id)"
      >
        <view class="row-between">
          <text class="shop-name">{{ item.name }}</text>
          <text :class="['tag', item.isOpen ? 'tag-open' : 'tag-closed']">
            {{ item.isOpen ? '营业中' : '休息中' }}
          </text>
        </view>
        <text class="muted">{{ item.address }}</text>
        <text v-if="item.notice" class="notice">{{ item.notice }}</text>
        <text class="muted">起送 {{ formatCents(item.minOrderCents) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Merchant } from '@/services/api/types';
import { useSessionStore } from '@/stores/session';
import { formatCents } from '@/utils/format';

const session = useSessionStore();
const merchants = ref<Merchant[]>([]);
const loading = ref(false);

onShow(() => {
  if (!session.isLoggedIn) {
    uni.navigateTo({ url: '/pages/student/login' });
    return;
  }
  loadMerchants();
});

async function loadMerchants() {
  loading.value = true;
  try {
    merchants.value = await studentApi.listMerchants();
  } catch {
    merchants.value = [];
  } finally {
    loading.value = false;
  }
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/student/shops/detail?id=${id}` });
}

function goOrders() {
  uni.navigateTo({ url: '/pages/student/order/list' });
}
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 16rpx;
}

.link {
  color: #07c160;
}

.shop-card {
  .shop-name {
    font-size: 32rpx;
    font-weight: 600;
  }

  .notice {
    display: block;
    margin: 8rpx 0;
    color: #ad6800;
    font-size: 24rpx;
  }
}
</style>
