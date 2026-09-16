<template>
  <view class="container">
    <view class="card" @tap="chooseAddress">
      <text class="label">收货地址</text>
      <text v-if="selectedAddress">
        {{ selectedAddress.buildingName }} {{ selectedAddress.room }} ·
        {{ selectedAddress.contactName }} {{ selectedAddress.contactPhone }}
      </text>
      <text v-else class="muted">请选择地址</text>
    </view>

    <view class="card">
      <text class="label">商品明细</text>
      <view v-for="item in cart.items" :key="item.productId" class="row-between item-row">
        <text>{{ item.productName }} x{{ item.quantity }}</text>
        <text>{{ formatCents(item.priceCents * item.quantity) }}</text>
      </view>
      <view class="row-between total-row">
        <text>合计</text>
        <text class="total">{{ formatCents(cart.totalCents) }}</text>
      </view>
    </view>

    <view class="card">
      <text class="label">支付方式</text>
      <radio-group @change="onProviderChange">
        <label class="radio-row">
          <radio value="MOCK" :checked="provider === 'MOCK'" />模拟支付
        </label>
        <label class="radio-row">
          <radio value="OFFLINE_MERCHANT_DIRECT" :checked="provider === 'OFFLINE_MERCHANT_DIRECT'" />
          商家线下直收
        </label>
      </radio-group>
    </view>

    <view v-if="provider === 'OFFLINE_MERCHANT_DIRECT'" class="notice-box">
      <text class="notice-title">商家线下直收说明</text>
      <text>
        选择此方式表示您将在取餐/收货时直接向商家支付餐费。平台订单仅用于取餐码与配送跟踪，线上不会扣款。请保留订单号以便核对。
      </text>
    </view>

    <view class="card">
      <text class="label">备注</text>
      <input v-model="remark" placeholder="口味、忌口等（选填）" />
    </view>

    <button class="btn-primary" :loading="submitting" @tap="submitOrder">提交订单</button>
  </view>
</template>

<script setup lang="ts">
import { onShow, onUnload } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { studentApi } from '@/services/api';
import type { Address, PaymentProvider } from '@/services/api/types';
import { payOrder } from '@/services/payment';
import { useCartStore } from '@/stores/cart';
import { formatCents } from '@/utils/format';

const cart = useCartStore();
const selectedAddress = ref<Address | null>(null);
const provider = ref<PaymentProvider>('MOCK');
const remark = ref('');
const submitting = ref(false);

onShow(() => {
  if (cart.isEmpty) {
    uni.showToast({ title: '购物车为空', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 500);
  }
  uni.$on('address-selected', onAddressSelected);
});

onUnload(() => {
  uni.$off('address-selected', onAddressSelected);
});

function onAddressSelected(addr: Address) {
  selectedAddress.value = addr;
}

function chooseAddress() {
  uni.navigateTo({ url: '/pages/student/address/list?select=1' });
}

function onProviderChange(e: { detail: { value: string } }) {
  provider.value = e.detail.value as PaymentProvider;
}

const checkoutKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function submitOrder() {
  if (!selectedAddress.value) {
    uni.showToast({ title: '请选择地址', icon: 'none' });
    return;
  }
  if (!cart.merchantId) return;

  submitting.value = true;
  try {
    const order = await studentApi.createOrder({
      merchantId: cart.merchantId,
      addressId: selectedAddress.value.id,
      items: cart.items.map((i) => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
      })),
      remark: remark.value || undefined,
      idempotencyKey: checkoutKey,
      paymentProvider: provider.value,
    });

    await payOrder(order.id, provider.value);

    cart.clear();
    uni.showToast({ title: '下单成功', icon: 'success' });
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/student/order/detail?id=${order.id}` });
    }, 500);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '下单失败';
    if (msg) uni.showToast({ title: msg, icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.label {
  display: block;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.item-row {
  padding: 8rpx 0;
}

.total-row {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #eee;
}

.total {
  color: #ee0a24;
  font-weight: bold;
}

.radio-row {
  display: block;
  padding: 12rpx 0;
}

.notice-title {
  display: block;
  font-weight: 600;
  margin-bottom: 8rpx;
}
</style>
