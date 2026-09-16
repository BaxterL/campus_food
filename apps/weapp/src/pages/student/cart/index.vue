<template>
  <view class="container">
    <view v-if="cart.isEmpty" class="empty">购物车是空的</view>
    <view v-else>
      <view class="card">
        <text class="shop-name">{{ cart.merchantName }}</text>
      </view>
      <view v-for="item in cart.items" :key="item.productId" class="card row-between">
        <view>
          <text class="name">{{ item.productName }}</text>
          <text class="muted">{{ formatCents(item.priceCents) }}</text>
        </view>
        <view class="qty-row">
          <button size="mini" @tap="cart.updateQuantity(item.productId, item.quantity - 1)">-</button>
          <text class="qty">{{ item.quantity }}</text>
          <button size="mini" @tap="cart.updateQuantity(item.productId, item.quantity + 1)">+</button>
        </view>
      </view>
      <view class="card row-between">
        <text>合计</text>
        <text class="total">{{ formatCents(cart.totalCents) }}</text>
      </view>
      <button class="btn-primary" @tap="goConfirm">去确认订单</button>
      <button class="btn-outline" style="margin-top: 16rpx" @tap="cart.clear()">清空购物车</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart';
import { formatCents } from '@/utils/format';

const cart = useCartStore();

function goConfirm() {
  if (cart.isEmpty) return;
  uni.navigateTo({ url: '/pages/student/order/confirm' });
}
</script>

<style scoped lang="scss">
.shop-name {
  font-weight: 600;
}

.name {
  display: block;
  font-size: 30rpx;
}

.total {
  color: #ee0a24;
  font-weight: bold;
  font-size: 32rpx;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.qty {
  min-width: 40rpx;
  text-align: center;
}
</style>
