import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch } from '../lib/api';
import type { AdminProfile, MfaSetupResponse } from '../lib/types';

export function MfaSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'enable'>('setup');

  const { data, isLoading } = useQuery({
    queryKey: ['mfa', 'setup'],
    queryFn: () =>
      apiFetch<MfaSetupResponse>('/api/v1/admin/mfa/setup', { method: 'POST' }),
    enabled: step === 'setup',
  });

  const enableMutation = useMutation({
    mutationFn: () =>
      apiFetch<AdminProfile>('/api/v1/admin/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
      navigate('/settings');
    },
    onError: () => setError('認証コードが正しくありません'),
  });

  if (isLoading && step === 'setup') return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">MFA セットアップ</h1>
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6">
        {step === 'setup' && data && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Google Authenticator で以下の QR コードをスキャンしてください。
            </p>
            <img
              src={data.qrCodeDataUrl}
              alt="TOTP QR Code"
              className="mx-auto mb-4 h-48 w-48"
            />
            <button
              type="button"
              onClick={() => setStep('enable')}
              className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
            >
              次へ
            </button>
          </>
        )}
        {step === 'enable' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enableMutation.mutate();
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-600">
              アプリに表示された 6 桁コードを入力して有効化してください。
            </p>
            <input
              type="text"
              required
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-center text-lg tracking-widest"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={enableMutation.isPending || code.length !== 6}
              className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enableMutation.isPending ? '有効化中...' : '有効化'}
            </button>
          </form>
        )}
        <Link
          to="/settings"
          className="mt-4 block text-center text-sm text-blue-600 hover:underline"
        >
          設定に戻る
        </Link>
      </div>
    </div>
  );
}
