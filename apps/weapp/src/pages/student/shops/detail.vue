<template>
  <view class="container">
    <view v-if="merchant" class="card">
      <view class="row-between">
        <text class="title">{{ merchant.name }}</text>
        <text :class="['tag', merchant.isOpen ? 'tag-open' : 'tag-closed']">
          {{ merchant.isOpen ? '营业中' : '休息中' }}
        </text>
      </view>
      <text class="muted">{{ merchant.address }}</text>
    </view>

    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="products.length === 0" class="empty">暂无商品</view>
    <view v-else>
      <view v-for="p in products" :key="p.id" class="card product-card row-between">
        <view class="info">
          <text class="name">{{ p.name }}</text>
          <text class="muted">{{ p.description || '' }}</text>
          <text class="price">{{ formatCents(p.priceCents) }}</text>
        </view>
        <button
          v-if="!p.soldOut && merchant?.isOpen"
          class="btn-primary mini"
          size="mini"
          @tap="addToCart(p)"
        >
          加购
        </button>
        <text v-else class="tag tag-closed">售罄</text>
      </view>
    </view>

    <view class="cart-bar row-between">
      <text>购物车 {{ cart.totalQuantity }} 件 · {{ formatCents(cart.totalCents) }}</text>
      <button class="btn-primary mini" size="mini" :disabled="cart.isEmpty" @tap="goCart">去结算</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Merchant, Product } from '@/services/api/types';
import { useCartStore } from '@/stores/cart';
import { formatCents } from '@/utils/format';

const cart = useCartStore();
const merchantId = ref('');
const merchant = ref<Merchant | null>(null);
const products = ref<Product[]>([]);
const loading = ref(false);

onLoad((query) => {
  merchantId.value = String(query?.id || '');
});

onShow(() => {
  if (merchantId.value) loadData();
});

async function loadData() {
  loading.value = true;
  try {
    merchant.value = await studentApi.getMerchant(merchantId.value);
    products.value = await studentApi.listProducts(merchantId.value);
  } catch {
    merchant.value = null;
    products.value = [];
  } finally {
    loading.value = false;
  }
}

function addToCart(p: Product) {
  if (!merchant.value) return;
  cart.addItem({
    merchantId: merchant.value.id,
    merchantName: merchant.value.name,
    productId: p.productId ?? p.id,
    skuId: p.skuId,
    productName: p.name,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
  });
  uni.showToast({ title: '已加入购物车', icon: 'none' });
}

function goCart() {
  uni.navigateTo({ url: '/pages/student/cart/index' });
}
</script>

<style scoped lang="scss">
.title {
  font-size: 34rpx;
  font-weight: 600;
}

.product-card .info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
}

.price {
  color: #ee0a24;
  font-weight: 600;
}

.cart-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.container {
  padding-bottom: 140rpx;
}
</style>
