import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setIdentityGetter } from '@/api/client';
import type { DevIdentity, OpsRole } from '@/api/types';

const STORAGE_KEY = 'ops-web-dev-identity';

const PRESET_IDENTITIES: DevIdentity[] = [
  {
    userId: 'seed-user-admin',
    displayName: '平台管理员',
    role: 'platform_admin',
    campusId: 'seed-campus-main',
  },
  {
    userId: 'seed-user-ops',
    displayName: '调度员',
    role: 'campus_ops',
    campusId: 'seed-campus-main',
  },
  {
    userId: 'seed-user-merchant',
    displayName: '商家店员',
    role: 'merchant_staff',
    campusId: 'seed-campus-main',
    merchantId: 'seed-merchant-1',
  },
];

interface AuthContextValue {
  identity: DevIdentity | null;
  presets: DevIdentity[];
  login: (identity: DevIdentity) => void;
  logout: () => void;
  switchRole: (role: OpsRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadIdentity(): DevIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevIdentity) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<DevIdentity | null>(() => loadIdentity());

  useEffect(() => {
    setIdentityGetter(() => identity);
  }, [identity]);

  const login = useCallback((next: DevIdentity) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIdentity(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentity(null);
  }, []);

  const switchRole = useCallback(
    (role: OpsRole) => {
      const preset = PRESET_IDENTITIES.find((item) => item.role === role);
      if (preset) login(preset);
    },
    [login],
  );

  const value = useMemo(
    () => ({ identity, presets: PRESET_IDENTITIES, login, logout, switchRole }),
    [identity, login, logout, switchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
