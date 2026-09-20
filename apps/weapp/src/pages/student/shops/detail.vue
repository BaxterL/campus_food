<template>
  <view class="page">
    <view v-if="merchant" class="hero card">
      <view class="row-between">
        <view class="hero-text">
          <text class="title">{{ merchant.name }}</text>
          <text class="muted">{{ merchant.address }}</text>
        </view>
        <text :class="['tag', merchant.isOpen ? 'tag-open' : 'tag-closed']">
          {{ merchant.isOpen ? '营业中' : '休息中' }}
        </text>
      </view>
      <text v-if="merchant.notice" class="notice">{{ merchant.notice }}</text>
    </view>

    <scroll-view v-if="categories.length > 1" class="cats" scroll-x :show-scrollbar="false">
      <view
        v-for="cat in categories"
        :key="cat"
        :class="['chip', activeCat === cat ? 'chip-active' : '']"
        @tap="activeCat = cat"
      >
        {{ cat }}
      </view>
    </scroll-view>

    <view v-if="loading" class="empty">菜单加载中...</view>
    <view v-else-if="visibleProducts.length === 0" class="empty">暂无商品</view>
    <view v-else class="menu">
      <view v-for="p in visibleProducts" :key="p.id" class="menu-row card">
        <ProductThumb :url="p.imageUrl" :name="p.name" size="md" />
        <view class="info">
          <text class="name">{{ p.name }}</text>
          <text class="muted desc">{{ p.description || p.categoryName || '招牌推荐' }}</text>
          <view class="row-between price-row">
            <text class="price">{{ formatCents(p.priceCents) }}</text>
            <view v-if="!p.soldOut && merchant?.isOpen" class="qty-ctl">
              <view
                v-if="qtyOf(p) > 0"
                class="btn-circle minus"
                @tap.stop="changeQty(p, -1)"
              >
                −
              </view>
              <text v-if="qtyOf(p) > 0" class="qty">{{ qtyOf(p) }}</text>
              <view class="btn-circle" @tap.stop="addToCart(p)">+</view>
            </view>
            <text v-else class="tag tag-closed">{{ p.soldOut ? '售罄' : '休息' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="dock">
      <view class="dock-inner">
        <view class="badge-wrap">
          <text class="badge">{{ cart.totalQuantity }}</text>
          <text class="dock-label">已选 {{ cart.totalQuantity }} 件</text>
        </view>
        <text class="dock-price">{{ formatCents(cart.totalCents) }}</text>
        <button class="btn-primary dock-btn" :disabled="cart.isEmpty" @tap="goCart">去结算</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import ProductThumb from '@/components/ProductThumb.vue';
import { studentApi } from '@/services/api';
import type { Merchant, Product } from '@/services/api/types';
import { useCartStore } from '@/stores/cart';
import { formatCents } from '@/utils/format';

const cart = useCartStore();
const merchantId = ref('');
const merchant = ref<Merchant | null>(null);
const products = ref<Product[]>([]);
const loading = ref(false);
const activeCat = ref('全部');

const categories = computed(() => {
  const set = new Set(products.value.map((p) => p.categoryName || '推荐'));
  return ['全部', ...Array.from(set)];
});

const visibleProducts = computed(() => {
  if (activeCat.value === '全部') return products.value;
  return products.value.filter((p) => (p.categoryName || '推荐') === activeCat.value);
});

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

function qtyOf(p: Product) {
  const id = p.productId ?? p.id;
  return cart.items.find((i) => i.productId === id && i.skuId === p.skuId)?.quantity ?? 0;
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
}

function changeQty(p: Product, delta: number) {
  const next = qtyOf(p) + delta;
  cart.updateQuantity(p.productId ?? p.id, next);
}

function goCart() {
  uni.navigateTo({ url: '/pages/student/cart/index' });
}
</script>

<style scoped lang="scss">
.page {
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.hero .title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
}

.hero-text {
  flex: 1;
  padding-right: 16rpx;
}

.notice {
  display: block;
  margin-top: 16rpx;
  color: #9a3412;
  font-size: 24rpx;
}

.cats {
  white-space: nowrap;
  margin-bottom: 16rpx;
}

.chip {
  display: inline-block;
  margin-right: 12rpx;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: #faf7f5;
  border: 1rpx solid #e7e2df;
  font-size: 24rpx;
}

.chip-active {
  background: #65c3c8;
  color: #003a3d;
  border-color: #65c3c8;
  font-weight: 700;
}

.menu-row {
  display: flex;
  gap: 20rpx;
  align-items: stretch;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 32rpx;
  font-weight: 700;
}

.desc {
  margin-top: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-row {
  margin-top: auto;
  padding-top: 16rpx;
}

.price {
  font-size: 34rpx;
  font-weight: 800;
  color: #291334;
}

.qty-ctl {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.qty {
  min-width: 36rpx;
  text-align: center;
  font-weight: 700;
}

.minus {
  background: #efeae6 !important;
  color: #291334 !important;
}

.dock {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.dock-inner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #291334;
  color: #faf7f5;
  border-radius: 999rpx;
  padding: 12rpx 12rpx 12rpx 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(41, 19, 52, 0.28);
}

.badge {
  display: inline-block;
  min-width: 36rpx;
  padding: 0 10rpx;
  border-radius: 999rpx;
  background: #ef9fbc;
  color: #291334;
  font-size: 20rpx;
  font-weight: 800;
  text-align: center;
  margin-right: 8rpx;
}

.dock-label {
  font-size: 22rpx;
  opacity: 0.8;
}

.dock-price {
  flex: 1;
  text-align: right;
  font-size: 32rpx;
  font-weight: 800;
}

.dock-btn {
  margin: 0;
  padding: 0 36rpx;
  line-height: 72rpx;
  height: 72rpx;
  font-size: 28rpx;
}
</style>
