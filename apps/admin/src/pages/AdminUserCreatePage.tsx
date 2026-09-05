import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { AdminUser, CreateAdminUserRequest } from '../lib/types';

export function AdminUserCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (body: CreateAdminUserRequest) =>
      apiFetch<AdminUser>('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      navigate('/settings/users');
    },
    onError: (err: Error) => {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError('このメールアドレスは既に登録されています');
        return;
      }
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    mutation.mutate({ name, email, password });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">管理者ユーザー追加</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">名前</label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">メールアドレス</label>
          <input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">パスワード</label>
          <input
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">8文字以上で入力してください</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            パスワード（確認）
          </label>
          <input
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? '追加中...' : '追加する'}
          </button>
          <Link
            to="/settings/users"
            className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
