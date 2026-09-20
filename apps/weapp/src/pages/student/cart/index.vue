<template>
  <view class="container">
    <view v-if="cart.isEmpty" class="empty">购物车还是空的，去菜单加点菜吧</view>
    <view v-else>
      <view class="card shop-line">
        <text class="shop-name">{{ cart.merchantName }}</text>
      </view>
      <view v-for="item in cart.items" :key="item.productId + (item.skuId || '')" class="card row-between item">
        <ProductThumb :url="item.imageUrl" :name="item.productName" size="sm" />
        <view class="info">
          <text class="name">{{ item.productName }}</text>
          <text class="price">{{ formatCents(item.priceCents) }}</text>
        </view>
        <view class="qty-row">
          <view class="btn-circle minus" @tap="cart.updateQuantity(item.productId, item.quantity - 1)">−</view>
          <text class="qty">{{ item.quantity }}</text>
          <view class="btn-circle" @tap="cart.updateQuantity(item.productId, item.quantity + 1)">+</view>
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
import { onShow } from '@dcloudio/uni-app';
import ProductThumb from '@/components/ProductThumb.vue';
import { useCartStore } from '@/stores/cart';
import { formatCents } from '@/utils/format';
import { requireLogin } from '@/utils/guard';

const cart = useCartStore();

onShow(() => {
  requireLogin();
});

function goConfirm() {
  if (cart.isEmpty) return;
  uni.navigateTo({ url: '/pages/student/order/confirm' });
}
</script>

<style scoped lang="scss">
.shop-name {
  font-weight: 800;
  font-size: 32rpx;
}

.item {
  gap: 16rpx;
}

.name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.info {
  flex: 1;
}

.price,
.total {
  font-weight: 800;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.qty {
  min-width: 40rpx;
  text-align: center;
  font-weight: 700;
}

.minus {
  background: #efeae6 !important;
  color: #291334 !important;
}
</style>
