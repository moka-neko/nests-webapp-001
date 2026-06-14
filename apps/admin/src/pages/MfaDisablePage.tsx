import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AdminProfile } from '../lib/types';

export function MfaDisablePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<AdminProfile>('/api/v1/admin/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ password, code }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
      navigate('/settings');
    },
    onError: () => setError('パスワードまたは認証コードが正しくありません'),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">MFA 無効化</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <p className="text-sm text-slate-600">
          パスワードと Google Authenticator の 6 桁コードを入力してください。
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium">パスワード</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">認証コード</label>
          <input
            type="text"
            required
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-center text-lg tracking-widest"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-red-600 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {mutation.isPending ? '無効化中...' : 'TOTP を無効化'}
        </button>
        <Link
          to="/settings"
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          キャンセル
        </Link>
      </form>
    </div>
  );
}
