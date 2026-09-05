import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { AdminUser } from '../lib/types';

export function AdminUsersListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiFetch<AdminUser[]>('/api/v1/admin/users'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600">読み込みに失敗しました</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/settings"
            className="mb-2 inline-block text-sm text-slate-600 hover:text-slate-900"
          >
            ← 設定に戻る
          </Link>
          <h1 className="text-2xl font-semibold">管理者ユーザー</h1>
        </div>
        <Link
          to="/settings/users/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          管理者を追加
        </Link>
      </div>
      {!data || data.length === 0 ? (
        <p className="text-slate-600">管理者ユーザーはまだいません</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">メールアドレス</th>
                <th className="px-4 py-3 font-medium">二要素認証</th>
                <th className="px-4 py-3 font-medium">作成日時</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.totpEnabled ? '有効' : '無効'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
