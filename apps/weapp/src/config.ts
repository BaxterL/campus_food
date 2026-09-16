const DEV_API = 'http://localhost:3000/api/v1';
const PROD_API = '/api/v1';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development' ? DEV_API : PROD_API);

export const STORAGE_KEYS = {
  token: 'cf_token',
  user: 'cf_user',
  activeRole: 'cf_active_role',
  cart: 'cf_cart',
} as const;

export const PAYMENT_POLL_INTERVAL_MS = 2000;
export const PAYMENT_POLL_MAX_ATTEMPTS = 15;
