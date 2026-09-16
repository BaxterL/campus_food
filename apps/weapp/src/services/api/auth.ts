import { http } from '@/services/http';
import type { User } from '@/services/api/types';

export interface DevLoginPayload {
  userId: string;
  role: string;
}

export interface WechatMiniLoginPayload {
  code: string;
  nickname?: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export const authApi = {
  devLogin(payload: DevLoginPayload) {
    return http.post<LoginResult>('/auth/dev-login', payload, { auth: false });
  },

  wechatMiniLogin(payload: WechatMiniLoginPayload) {
    return http.post<LoginResult>('/auth/wechat-mini-login', payload, { auth: false });
  },

  me() {
    return http.get<User>('/auth/me');
  },
};
