<template>
  <view class="container">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="addresses.length === 0" class="empty">暂无地址</view>
    <view v-else>
      <view v-for="addr in addresses" :key="addr.id" class="card">
        <view @tap="selectAddress(addr)">
          <view class="row-between">
            <text class="name">{{ addr.contactName }} {{ addr.contactPhone }}</text>
            <text v-if="addr.isDefault" class="tag tag-open">默认</text>
          </view>
          <text>{{ addr.buildingName }} {{ addr.room }}</text>
        </view>
        <view v-if="!selectMode" class="actions">
          <button class="btn-outline mini" size="mini" @tap="goEdit(addr.id)">编辑</button>
          <button class="btn-danger mini" size="mini" @tap="removeAddress(addr.id)">删除</button>
        </view>
      </view>
    </view>
    <button class="btn-primary" @tap="goEdit()">新增地址</button>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Address } from '@/services/api/types';
import { requireLogin } from '@/utils/guard';

const loading = ref(false);
const addresses = ref<Address[]>([]);
const selectMode = ref(false);

onShow(() => {
  if (!requireLogin()) return;
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as { options?: Record<string, string> };
  selectMode.value = current?.options?.select === '1';
  loadAddresses();
});

async function loadAddresses() {
  loading.value = true;
  try {
    addresses.value = await studentApi.listAddresses();
  } catch {
    addresses.value = [];
  } finally {
    loading.value = false;
  }
}

function selectAddress(addr: Address) {
  if (!selectMode.value) return;
  uni.$emit('address-selected', addr);
  uni.navigateBack();
}

function goEdit(id?: string) {
  const url = id
    ? `/pages/student/address/edit?id=${id}`
    : '/pages/student/address/edit';
  uni.navigateTo({ url });
}

async function removeAddress(id: string) {
  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '删除地址',
      content: '确定删除该地址吗？',
      success: (res) => resolve(res.confirm),
    });
  });
  if (!confirmed) return;
  try {
    await studentApi.deleteAddress(id);
    uni.showToast({ title: '已删除', icon: 'success' });
    await loadAddresses();
  } catch {
    // handled
  }
}
</script>

<style scoped lang="scss">
.name {
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
</style>
