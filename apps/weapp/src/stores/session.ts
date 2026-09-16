import { defineStore } from 'pinia';
import { STORAGE_KEYS } from '@/config';
import { authApi } from '@/services/api';
import type { Role, User } from '@/services/api/types';
import { getJson, getString, remove, setJson, setString } from '@/utils/storage';

interface SessionState {
  token: string | null;
  user: User | null;
  activeRole: Role | null;
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    token: getString(STORAGE_KEYS.token),
    user: getJson<User>(STORAGE_KEYS.user),
    activeRole: getJson<Role>(STORAGE_KEYS.activeRole),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    roles: (state) => state.user?.roles ?? [],
    hasRole: (state) => (role: Role) => state.user?.roles.includes(role) ?? false,
    displayName: (state) => state.user?.nickname || state.user?.phone || '用户',
  },

  actions: {
    persist() {
      if (this.token) setString(STORAGE_KEYS.token, this.token);
      else remove(STORAGE_KEYS.token);
      if (this.user) setJson(STORAGE_KEYS.user, this.user);
      else remove(STORAGE_KEYS.user);
      if (this.activeRole) setJson(STORAGE_KEYS.activeRole, this.activeRole);
      else remove(STORAGE_KEYS.activeRole);
    },

    setSession(token: string, user: User) {
      this.token = token;
      this.user = user;
      if (!this.activeRole || !user.roles.includes(this.activeRole)) {
        this.activeRole = user.roles[0] ?? null;
      }
      this.persist();
    },

    setActiveRole(role: Role) {
      if (!this.user?.roles.includes(role)) {
        uni.showToast({ title: '无此角色权限', icon: 'none' });
        return;
      }
      this.activeRole = role;
      this.persist();
    },

    async refreshProfile() {
      if (!this.token) return;
      const user = await authApi.me();
      this.user = user;
      this.persist();
    },

    logout() {
      this.token = null;
      this.user = null;
      this.activeRole = null;
      this.persist();
    },
  },
});
