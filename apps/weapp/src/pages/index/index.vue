<template>
  <view class="container">
    <view class="hero card">
      <text class="kicker">Campus Food</text>
      <text class="title">校园外卖</text>
      <text class="muted">点一份热乎的，送到宿舍楼下</text>
      <view v-if="session.isLoggedIn" class="user-row">
        <text class="name">{{ session.displayName }}</text>
        <text class="muted">{{ roleLabel }}</text>
      </view>
      <button v-else class="btn-primary login-cta" @tap="goLogin">微信登录 / 开发登录</button>
    </view>

    <view v-if="session.isLoggedIn" class="grid">
      <view v-if="session.hasRole('student')" class="tile card" @tap="enterRole('student')">
        <text class="tile-emoji">🍱</text>
        <text class="tile-title">去点餐</text>
        <text class="muted">菜单、购物车、送达码</text>
      </view>
      <view v-if="session.hasRole('merchant')" class="tile card" @tap="enterRole('merchant')">
        <text class="tile-emoji">👩‍🍳</text>
        <text class="tile-title">出餐台</text>
        <text class="muted">接单、出餐、售罄</text>
      </view>
      <view v-if="session.hasRole('rider')" class="tile card" @tap="enterRole('rider')">
        <text class="tile-emoji">🚲</text>
        <text class="tile-title">配送</text>
        <text class="muted">值班与取送任务</text>
      </view>
    </view>

    <button v-if="session.isLoggedIn" class="btn-outline" @tap="logout">退出登录</button>
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
.kicker {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: rgba(41, 19, 52, 0.45);
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  margin: 8rpx 0;
}

.user-row {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.name {
  font-weight: 700;
}

.login-cta {
  margin-top: 28rpx;
  width: 100%;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tile-emoji {
  font-size: 48rpx;
}

.tile-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  margin: 8rpx 0;
}
</style>
