<template>
  <view class="container">
    <view class="card">
      <picker :range="buildings" range-key="name" @change="onBuildingChange">
        <view class="field">
          <text class="label">楼栋</text>
          <text>{{ selectedBuilding?.name || '请选择楼栋' }}</text>
        </view>
      </picker>
      <view class="field">
        <text class="label">房间号</text>
        <input v-model="room" placeholder="如 301" />
      </view>
      <view class="field">
        <text class="label">联系人</text>
        <input v-model="contactName" placeholder="姓名" />
      </view>
      <view class="field">
        <text class="label">手机号</text>
        <input v-model="contactPhone" type="number" placeholder="手机号" />
      </view>
      <label class="field row-between">
        <text class="label">设为默认</text>
        <switch :checked="isDefault" @change="isDefault = $event.detail.value" />
      </label>
    </view>
    <button class="btn-primary" :loading="saving" @tap="save">保存</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Building } from '@/services/api/types';

const addressId = ref('');
const buildings = ref<Building[]>([]);
const selectedBuilding = ref<Building | null>(null);
const room = ref('');
const contactName = ref('');
const contactPhone = ref('');
const isDefault = ref(false);
const saving = ref(false);

onLoad(async (query) => {
  addressId.value = String(query?.id || '');
  buildings.value = await studentApi.listBuildings().catch(() => []);
});

function onBuildingChange(e: { detail: { value: string } }) {
  const idx = Number(e.detail.value);
  selectedBuilding.value = buildings.value[idx] ?? null;
}

async function save() {
  if (!selectedBuilding.value) {
    uni.showToast({ title: '请选择楼栋', icon: 'none' });
    return;
  }
  if (!room.value || !contactName.value || !contactPhone.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      buildingId: selectedBuilding.value.id,
      room: room.value,
      contactName: contactName.value,
      contactPhone: contactPhone.value,
      isDefault: isDefault.value,
    };
    if (addressId.value) {
      await studentApi.updateAddress(addressId.value, payload);
    } else {
      await studentApi.createAddress(payload);
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch {
    // handled
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.field {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.label {
  display: block;
  color: #888;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}
</style>
