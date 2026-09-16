<template>
  <view class="container">
    <view class="card hero">
      <text class="title">校园外卖</text>
      <text class="muted">周末 MVP · 按角色进入</text>
      <view v-if="session.isLoggedIn" class="user-row">
        <text>{{ session.displayName }}</text>
        <text class="muted">角色：{{ roleLabel }}</text>
      </view>
      <button v-else class="btn-primary" @tap="goLogin">去登录</button>
    </view>

    <view v-if="session.isLoggedIn" class="card">
      <text class="section-title">功能入口</text>
      <view class="entry-list">
        <view v-if="session.hasRole('student')" class="entry" @tap="enterRole('student')">
          <text class="entry-title">学生端</text>
          <text class="muted">点餐、地址、订单、送达码</text>
        </view>
        <view v-if="session.hasRole('merchant')" class="entry" @tap="enterRole('merchant')">
          <text class="entry-title">商家端</text>
          <text class="muted">接单、出餐、售罄、营业开关</text>
        </view>
        <view v-if="session.hasRole('rider')" class="entry" @tap="enterRole('rider')">
          <text class="entry-title">骑手端</text>
          <text class="muted">值班、任务、取餐码、送达码</text>
        </view>
      </view>
    </view>

    <view v-if="session.isLoggedIn" class="card">
      <button class="btn-outline" @tap="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Role } from '@/services/api/types';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();

const roleLabels: Record<Role, string> = {
  student: '学生',
  merchant: '商家',
  rider: '骑手',
  dispatcher: '调度',
  admin: '管理员',
};

const roleLabel = computed(() =>
  session.activeRole ? roleLabels[session.activeRole] : session.roles.map((r) => roleLabels[r]).join(' / '),
);

function goLogin() {
  uni.navigateTo({ url: '/pages/student/login' });
}

function enterRole(role: Role) {
  session.setActiveRole(role);
  if (role === 'student') {
    uni.navigateTo({ url: '/pages/student/shops/index' });
  } else if (role === 'merchant') {
    uni.navigateTo({ url: '/pages/merchant/home' });
  } else if (role === 'rider') {
    uni.navigateTo({ url: '/pages/rider/home' });
  }
}

function logout() {
  session.logout();
  uni.showToast({ title: '已退出', icon: 'none' });
}
</script>

<style scoped lang="scss">
.hero {
  text-align: center;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.user-row {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.section-title {
  display: block;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.entry {
  padding: 24rpx;
  border: 1rpx solid #eee;
  border-radius: 12rpx;
}

.entry-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
</style>
