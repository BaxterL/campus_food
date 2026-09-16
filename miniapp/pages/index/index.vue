<template>
  <view class="home">
    <view class="home-header">
      <view class="home-title">校园外卖</view>
      <view class="home-sub">自取 · 冷启动演示</view>
      <view class="home-search">
        <uv-search
          v-model="keyword"
          placeholder="搜索店铺或菜品"
          :showAction="false"
          bgColor="#F8FAFC"
          @search="loadShops"
          @change="onSearchChange"
        />
      </view>
    </view>

    <view class="home-body">
      <view class="section-label" v-if="shops.length">附近可自取 · {{ shops.length }} 家</view>
      <view v-if="!loading && !shops.length" class="empty">
        <view class="empty-title">暂无店铺</view>
        <view class="empty-desc">冷启动中，请稍后刷新</view>
        <view class="empty-btn" @tap="loadShops">刷新</view>
      </view>

      <view
        class="shop-card"
        v-for="item in shops"
        :key="item.id"
        @tap="goShop(item)"
      >
        <image class="shop-thumb" :src="item.image || '/static/images/new003.jpg'" mode="aspectFill" />
        <view class="shop-body">
          <view class="shop-name">{{ item.name }}</view>
          <view class="shop-meta">
            <text class="tag">自取</text>
            <text>{{ formatHours(item) }}</text>
            <text class="dot" v-if="item.deliveryPrice != null">起送 ¥{{ item.deliveryPrice || item.minPrice || 0 }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { shopGetList } from '@/api/market'
import { useMainStore } from '@/store/store'
import { storeToRefs } from 'pinia'
import { formatDateTime } from '@/utils/util'

const main = useMainStore()
const { location } = storeToRefs(main)
const shops = ref([])
const keyword = ref('')
const loading = ref(false)
let searchTimer = null

const formatHours = (item) => {
  if (!item.startTime || !item.endTime) return '营业中'
  try {
    return `${formatDateTime(item.startTime, 'hh:mm')}–${formatDateTime(item.endTime, 'hh:mm')}`
  } catch (e) {
    return '营业中'
  }
}

const loadShops = async () => {
  loading.value = true
  try {
    const data = await shopGetList({
      lat: location.value?.latitude || 0,
      lng: location.value?.longitude || 0,
      kw: keyword.value || '',
      shop_id: 0
    })
    shops.value = Array.isArray(data) ? data : (data?.list || [])
  } catch (e) {
    shops.value = []
  } finally {
    loading.value = false
  }
}

const onSearchChange = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadShops, 300)
}

const goShop = (item) => {
  main.SET_ORDER_TYPE('takein')
  if (item) main.SET_STORE(item)
  uni.switchTab({ url: '/pages/menu/menu' })
}

onShow(() => {
  main.SET_ORDER_TYPE('takein')
  loadShops()
})
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: #F5F5F7;
}
.home-header {
  background: #fff;
  padding: 24rpx 32rpx 28rpx;
  border-bottom: 1px solid #F3F4F6;
}
.home-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #111827;
}
.home-sub {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #6B7280;
}
.home-search {
  margin-top: 24rpx;
}
.home-body {
  padding: 24rpx 32rpx 48rpx;
}
.section-label {
  font-size: 24rpx;
  color: #6B7280;
  margin-bottom: 24rpx;
}
.shop-card {
  display: flex;
  gap: 24rpx;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
}
.shop-thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #F8FAFC;
  flex-shrink: 0;
}
.shop-body {
  flex: 1;
  min-width: 0;
}
.shop-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}
.shop-meta {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  align-items: center;
  font-size: 24rpx;
  color: #6B7280;
}
.tag {
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}
.dot::before {
  content: '·';
  margin-right: 12rpx;
  color: #9CA3AF;
}
.empty {
  text-align: center;
  padding: 120rpx 40rpx;
}
.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}
.empty-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #6B7280;
}
.empty-btn {
  margin: 32rpx auto 0;
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 16rpx;
  border: 1px solid #E5E7EB;
  color: #6B7280;
  font-size: 28rpx;
}
</style>
