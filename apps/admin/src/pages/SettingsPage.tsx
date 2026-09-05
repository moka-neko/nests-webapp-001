import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch } from '../lib/api';
import type { AdminProfile } from '../lib/types';

export function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => apiFetch<AdminProfile>('/api/v1/admin/me'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">アカウント設定</h1>
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6">
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-slate-500">名前</dt>
            <dd className="font-medium">{data?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">メールアドレス</dt>
            <dd className="font-medium">{data?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">二要素認証（TOTP）</dt>
            <dd className="font-medium">
              {data?.totpEnabled ? '有効' : '無効'}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex gap-3">
          {!data?.totpEnabled ? (
            <Link
              to="/settings/mfa/setup"
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              TOTP を有効化
            </Link>
          ) : (
            <Link
              to="/settings/mfa/disable"
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              TOTP を無効化
            </Link>
          )}
        </div>
      </div>
      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-medium">管理者ユーザー</h2>
        <p className="mt-2 text-sm text-slate-600">
          管理画面にログインできるユーザーを追加できます。
        </p>
        <Link
          to="/settings/users"
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          管理者ユーザーを管理
        </Link>
      </div>
    </div>
  );
}
