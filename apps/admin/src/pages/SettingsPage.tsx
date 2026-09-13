import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { AdminProfile, UpdateAdminProfileRequest } from '../lib/types';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => apiFetch<AdminProfile>('/api/v1/admin/me'),
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setEmail(data.email);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body: UpdateAdminProfileRequest) =>
      apiFetch<AdminProfile>('/api/v1/admin/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('アカウント情報を保存しました');
    },
    onError: (err: Error) => {
      setSuccess('');
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
    setSuccess('');

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError('新しいパスワードが一致しません');
        return;
      }
      if (newPassword.length < 8) {
        setError('新しいパスワードは8文字以上で入力してください');
        return;
      }
    }

    const body: UpdateAdminProfileRequest = {
      name,
      email,
      currentPassword,
    };
    if (newPassword) {
      body.newPassword = newPassword;
    }
    mutation.mutate(body);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">アカウント設定</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-medium">プロフィール</h2>
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
          <label className="mb-1 block text-sm font-medium">
            メールアドレス
          </label>
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
          <label className="mb-1 block text-sm font-medium">
            現在のパスワード
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            autoComplete="current-password"
          />
          <p className="mt-1 text-xs text-slate-500">
            変更を保存するには現在のパスワードが必要です
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            新しいパスワード（変更する場合）
          </label>
          <input
            type="password"
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-slate-500">
            変更しない場合は空欄のままにしてください（8文字以上）
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? '保存中...' : '保存する'}
        </button>
      </form>
      <div className="mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-medium">二要素認証（TOTP）</h2>
        <p className="mt-2 font-medium">
          {data?.totpEnabled ? '有効' : '無効'}
        </p>
        <div className="mt-4">
          {!data?.totpEnabled ? (
            <Link
              to="/settings/mfa/setup"
              className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              TOTP を有効化
            </Link>
          ) : (
            <Link
              to="/settings/mfa/disable"
              className="inline-block rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
