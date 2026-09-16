<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="products.length === 0" class="empty">暂无商品</view>
    <view v-else>
      <view v-for="p in products" :key="p.id" class="card row-between">
        <view>
          <text class="name">{{ p.name }}</text>
          <text class="muted">{{ formatCents(p.priceCents) }}</text>
        </view>
        <view class="row-between" style="gap: 16rpx">
          <text :class="['tag', p.soldOut ? 'tag-closed' : 'tag-open']">
            {{ p.soldOut ? '售罄' : '在售' }}
          </text>
          <switch :checked="!p.soldOut" @change="toggleSoldOut(p, $event)" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { merchantApi } from '@/services/api';
import type { Product } from '@/services/api/types';
import { formatCents } from '@/utils/format';

const products = ref<Product[]>([]);
const loading = ref(false);

onShow(() => {
  loadProducts();
});

async function loadProducts() {
  loading.value = true;
  try {
    products.value = await merchantApi.listProducts();
  } catch {
    products.value = [];
  } finally {
    loading.value = false;
  }
}

async function toggleSoldOut(p: Product, e: { detail: { value: boolean } }) {
  const soldOut = !e.detail.value;
  try {
    await merchantApi.setSoldOut(p.id, soldOut);
    p.soldOut = soldOut;
    uni.showToast({ title: soldOut ? '已标记售罄' : '已恢复售卖', icon: 'none' });
  } catch {
    loadProducts();
  }
}
</script>

<style scoped lang="scss">
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
