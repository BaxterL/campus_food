import type { Role } from '@/services/api/types';
import { useSessionStore } from '@/stores/session';

export function requireLogin(): boolean {
  const session = useSessionStore();
  if (!session.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.navigateTo({ url: '/pages/student/login' }), 300);
    return false;
  }
  return true;
}

export function requireRole(role: Role): boolean {
  if (!requireLogin()) return false;
  const session = useSessionStore();
  if (!session.hasRole(role)) {
    uni.showToast({ title: '无此角色权限', icon: 'none' });
    setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 300);
    return false;
  }
  session.setActiveRole(role);
  return true;
}
