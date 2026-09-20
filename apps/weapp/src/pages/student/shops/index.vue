<template>
  <view class="container">
    <view class="hero card">
      <text class="kicker">今晚想吃点什么</text>
      <text class="title">校园外卖</text>
      <view class="row-between">
        <text class="muted">邀请制店铺 · 楼栋配送</text>
        <text class="link" @tap="goOrders">我的订单</text>
      </view>
    </view>

    <view v-if="loading" class="empty">店铺加载中...</view>
    <view v-else-if="merchants.length === 0" class="empty">暂无营业店铺</view>
    <view v-else>
      <view
        v-for="item in merchants"
        :key="item.id"
        class="shop card"
        @tap="goDetail(item.id)"
      >
        <view class="cover">
          <text class="cover-emoji">🍜</text>
        </view>
        <view class="body">
          <view class="row-between">
            <text class="shop-name">{{ item.name }}</text>
            <text :class="['tag', item.isOpen ? 'tag-open' : 'tag-closed']">
              {{ item.isOpen ? '营业中' : '休息中' }}
            </text>
          </view>
          <text class="muted">{{ item.address }}</text>
          <text v-if="item.notice" class="notice">{{ item.notice }}</text>
          <text class="meta">起送 {{ formatCents(item.minOrderCents) }}</text>
        </view>
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
.kicker {
  display: block;
  font-size: 24rpx;
  color: rgba(41, 19, 52, 0.55);
  letter-spacing: 2rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 800;
  margin: 8rpx 0 16rpx;
}

.link {
  color: #0f766e;
  font-weight: 700;
}

.shop {
  display: flex;
  gap: 20rpx;
  padding: 0;
  overflow: hidden;
}

.cover {
  width: 168rpx;
  min-height: 168rpx;
  background: linear-gradient(160deg, #65c3c8, #eeaf3a);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-emoji {
  font-size: 64rpx;
}

.body {
  flex: 1;
  padding: 24rpx 24rpx 24rpx 0;
}

.shop-name {
  font-size: 32rpx;
  font-weight: 800;
}

.notice,
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
}

.notice {
  color: #9a3412;
}

.meta {
  color: rgba(41, 19, 52, 0.55);
}
</style>
