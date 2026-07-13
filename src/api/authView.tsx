import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiFetch } from './client';

export interface Account { id: string; email: string; name: string; picture?: string }

export function GoogleLoginPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787/api/v1';
  return <main className="auth-page"><div className="auth-card"><div className="brand"><span className="brand-mark">M</span><span>MagicHeroes</span></div><h2>Đăng nhập dashboard</h2><p>Quản lý server và dữ liệu RPG an toàn.</p><a className="google-button" href={`${apiBase}/auth/google`}>Tiếp tục với Google</a><small>Chỉ Google OAuth. Không lưu mật khẩu Google.</small></div></main>;
}

export function Protected({ children }: { children: ReactNode }) {
  const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  useEffect(() => {
    if (useMock) {
      setAccount({ id: 'mock-admin', email: 'admin@magicheroes.local', name: 'Mock Admin' });
      setLoading(false);
      return;
    }
    apiFetch<Account>('/auth/me').then(setAccount).catch(() => setAccount(null)).finally(() => setLoading(false));
  }, [location.pathname, useMock]);
  if (loading) return <div className="loading-state">Đang kiểm tra phiên đăng nhập...</div>;
  return account ? <>{children}</> : <Navigate to="/login" replace />;
}
