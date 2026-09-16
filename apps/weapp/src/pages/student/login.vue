<template>
  <view class="container">
    <view class="card">
      <text class="title">登录</text>
      <text class="muted">开发环境可用快捷登录；正式环境走微信登录</text>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="card">
      <button class="btn-primary" :loading="loading" @tap="wechatLogin">微信一键登录</button>
    </view>
    <!-- #endif -->

    <view class="card">
      <text class="section">开发登录（联调后端 dev-login）</text>
      <input v-model="devUserId" class="input" placeholder="seed-user-student" />
      <picker :range="roleOptions" :value="roleIndex" @change="onRoleChange">
        <view class="picker">{{ roleOptions[roleIndex] }}</view>
      </picker>
      <button class="btn-outline" :loading="loading" @tap="devLogin">开发登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { wechatLogin as wxLogin } from '@/platform/wechat';
import { authApi } from '@/services/api';
import type { Role } from '@/services/api/types';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const loading = ref(false);
const devUserId = ref('seed-user-student');
const roleOptions = ['student', 'merchant', 'rider'];
const roleIndex = ref(0);

function onRoleChange(e: { detail: { value: string } }) {
  roleIndex.value = Number(e.detail.value);
}

async function devLogin() {
  if (!devUserId.value.trim()) {
    uni.showToast({ title: '请输入用户 ID', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const role = roleOptions[roleIndex.value] as Role;
    const result = await authApi.devLogin({ userId: devUserId.value.trim(), role });
    session.setSession(result.token, result.user);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch {
    // http 层已 toast
  } finally {
    loading.value = false;
  }
}

async function wechatLogin() {
  loading.value = true;
  try {
    const { code } = await wxLogin();
    const result = await authApi.wechatMiniLogin({ code });
    session.setSession(result.token, result.user);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '登录失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.section {
  display: block;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.input,
.picker {
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}
</style>
