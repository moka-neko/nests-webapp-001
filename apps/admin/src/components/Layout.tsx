import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { logout } from '../lib/auth';
import type { AdminProfile } from '../lib/types';

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => apiFetch<AdminProfile>('/api/v1/admin/me'),
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold text-slate-900">
              塾 応募管理
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link to="/teachers" className="text-slate-600 hover:text-slate-900">
                先生応募
              </Link>
              <Link to="/students" className="text-slate-600 hover:text-slate-900">
                生徒応募
              </Link>
              <Link to="/settings" className="text-slate-600 hover:text-slate-900">
                設定
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {profile && (
              <span className="text-slate-600">{profile.name}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
