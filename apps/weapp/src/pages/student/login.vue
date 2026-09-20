<template>
  <view class="container">
    <view class="card hero">
      <text class="title">登录</text>
      <text class="muted">
        微信小程序里，扫码进入后会调用 wx.login 拿到一次性 code，服务器换成 openid，再签发我们自己的登录凭证。凭证存在本地存储；H5 预览会同步写到 Cookie `cf_session`。不是公众号网页那套 document.cookie 登录。
      </text>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="card">
      <button class="btn-primary" :loading="loading" @tap="wechatLogin">微信一键登录</button>
      <text class="muted hint">需配置 AppId / AppSecret。未配置时请用下方开发登录。</text>
    </view>
    <!-- #endif -->

    <view class="card">
      <text class="section">开发登录</text>
      <input v-model="devUserId" class="input" placeholder="seed-user-student" />
      <picker :range="roleLabels" :value="roleIndex" @change="onRoleChange">
        <view class="picker">{{ roleLabels[roleIndex] }}</view>
      </picker>
      <button class="btn-outline" :loading="loading" @tap="devLogin">进入</button>
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
const roleOptions: Role[] = ['student', 'merchant', 'rider'];
const roleLabels = ['学生', '商家', '骑手'];
const roleIndex = ref(0);

function onRoleChange(e: { detail: { value: string } }) {
  roleIndex.value = Number(e.detail.value);
}

async function persistAndBack(token: string, user: Parameters<typeof session.setSession>[1]) {
  session.setSession(token, user);
  uni.showToast({ title: '登录成功', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 400);
}

async function devLogin() {
  if (!devUserId.value.trim()) {
    uni.showToast({ title: '请输入用户 ID', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const role = roleOptions[roleIndex.value];
    const result = await authApi.devLogin({ userId: devUserId.value.trim(), role });
    await persistAndBack(result.token, result.user);
  } catch {
    // http toast
  } finally {
    loading.value = false;
  }
}

async function wechatLogin() {
  loading.value = true;
  try {
    const { code } = await wxLogin();
    const result = await authApi.wechatMiniLogin({ code });
    await persistAndBack(result.token, result.user);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '微信登录暂未开通';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  margin-bottom: 12rpx;
}

.section {
  display: block;
  margin-bottom: 16rpx;
  font-weight: 700;
}

.hint {
  display: block;
  margin-top: 16rpx;
}

.input,
.picker {
  border: 1rpx solid #e7e2df;
  background: #efeae6;
  border-radius: 16rpx;
  padding: 22rpx;
  margin-bottom: 16rpx;
}
</style>
