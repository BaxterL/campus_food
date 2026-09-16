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
}

export function getString(key: string): string | null {
  const raw = uni.getStorageSync(key);
  return raw ? String(raw) : null;
}

export function setString(key: string, value: string): void {
  uni.setStorageSync(key, value);
}
