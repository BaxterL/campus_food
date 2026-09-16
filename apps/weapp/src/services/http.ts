import { API_BASE_URL } from '@/config';
import { STORAGE_KEYS } from '@/config';
import { ApiError, type ApiEnvelope, type ApiErrorBody } from '@/services/api/types';
import { getString } from '@/utils/storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
  headers?: Record<string, string>;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${normalized}`;
  if (!params) return url;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return query ? `${url}?${query}` : url;
}

function handleUnauthorized(): void {
  uni.removeStorageSync(STORAGE_KEYS.token);
  uni.removeStorageSync(STORAGE_KEYS.user);
  uni.showToast({ title: '请重新登录', icon: 'none' });
  setTimeout(() => {
    uni.navigateTo({ url: '/pages/student/login' });
  }, 500);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, params, auth = true, headers = {} } = options;
  const token = getString(STORAGE_KEYS.token);

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const userJson = getString(STORAGE_KEYS.user);
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as { id?: string; roles?: string[]; merchantId?: string };
      if (user.id) requestHeaders['x-dev-user-id'] = user.id;
      const role = user.roles?.[0];
      if (role) requestHeaders['x-dev-role'] = role;
      if (user.merchantId) requestHeaders['x-dev-merchant-id'] = user.merchantId;
    } catch {
      // ignore malformed session
    }
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: buildUrl(path, params),
      method,
      data,
      header: requestHeaders,
      success: (res) => {
        const status = res.statusCode ?? 0;
        const body = res.data as ApiEnvelope<T> | ApiErrorBody | undefined;

        if (status === 401) {
          handleUnauthorized();
          reject(new ApiError('未登录或会话已过期', 'UNAUTHORIZED'));
          return;
        }

        if (status < 200 || status >= 300) {
          const errBody = body as ApiErrorBody | undefined;
          const message = errBody?.error?.message || `请求失败 (${status})`;
          const code = errBody?.error?.code || 'HTTP_ERROR';
          uni.showToast({ title: message, icon: 'none' });
          reject(new ApiError(message, code, errBody?.requestId));
          return;
        }

        if (body && typeof body === 'object' && 'error' in body) {
          const errBody = body as ApiErrorBody;
          const message = errBody.error.message || '请求失败';
          uni.showToast({ title: message, icon: 'none' });
          reject(new ApiError(message, errBody.error.code, errBody.requestId));
          return;
        }

        const envelope = body as ApiEnvelope<T>;
        resolve(envelope?.data ?? (body as T));
      },
      fail: (err) => {
        const message = err.errMsg || '网络异常';
        uni.showToast({ title: message, icon: 'none' });
        reject(new ApiError(message, 'NETWORK_ERROR'));
      },
    });
  });
}

export const http = {
  get: <T>(path: string, params?: RequestOptions['params'], options?: Omit<RequestOptions, 'method' | 'params'>) =>
    request<T>(path, { ...options, method: 'GET', params }),
  post: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    request<T>(path, { ...options, method: 'POST', data }),
  put: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    request<T>(path, { ...options, method: 'PUT', data }),
  patch: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    request<T>(path, { ...options, method: 'PATCH', data }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
