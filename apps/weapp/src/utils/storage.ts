import { STORAGE_KEYS } from '@/config';

const SESSION_COOKIE = 'cf_session';

function writeSessionCookie(token: string | null) {
  // #ifdef H5
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  }
  // #endif
}

export function getJson<T>(key: string): T | null {
  try {
    const raw = uni.getStorageSync(key);
    if (!raw) return null;
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}

export function setJson(key: string, value: unknown): void {
  uni.setStorageSync(key, JSON.stringify(value));
}

export function remove(key: string): void {
  uni.removeStorageSync(key);
  if (key === STORAGE_KEYS.token) writeSessionCookie(null);
}

export function getString(key: string): string | null {
  const raw = uni.getStorageSync(key);
  return raw ? String(raw) : null;
}

export function setString(key: string, value: string): void {
  uni.setStorageSync(key, value);
  if (key === STORAGE_KEYS.token) writeSessionCookie(value);
}
