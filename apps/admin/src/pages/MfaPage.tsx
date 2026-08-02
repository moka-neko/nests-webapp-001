import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { clearMfaToken, getMfaToken, setAccessToken } from '../lib/auth';
import type { LoginResponse } from '../lib/types';

const DEFAULT_MFA_ERROR = '認証コードが正しくありません';

export function MfaPage() {
  const navigate = useNavigate();
  // sessionStorage を毎レンダーで直接読むと、送信中に clearMfaToken() を呼んだ
  // 際に「トークンが無い」ガードが再発火してログイン画面へ強制的に戻される
  // (認証に成功した直後も含めて) ため、マウント時に一度だけ読み込んで state
  // として保持する。
  const [mfaToken] = useState(() => getMfaToken());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mfaToken) {
      navigate('/login', { replace: true });
    }
  }, [mfaToken, navigate]);

  if (!mfaToken) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>(
        '/api/v1/admin/mfa/verify',
        {
          method: 'POST',
          body: JSON.stringify({ mfaToken, code }),
        },
        false,
      );
      if (res.accessToken) {
        setAccessToken(res.accessToken);
        clearMfaToken();
        navigate('/');
      }
    } catch (err) {
      // ハードコードされた汎用メッセージではなく、サーバーが返す実際の
      // エラー内容（コード誤り／MFAトークン期限切れ等）をそのまま表示する。
      const message = err instanceof Error ? err.message : DEFAULT_MFA_ERROR;
      if (message.includes('MFA トークン')) {
        // トークン自体が失効している場合、コードを再入力しても成功しない
        // ためログイン画面からやり直してもらう。
        clearMfaToken();
        setError(`${message} ログイン画面からやり直してください。`);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-semibold">二要素認証</h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          Google Authenticator の 6 桁コードを入力してください
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loading || code.length !== 6}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '確認中...' : '確認'}
          </button>
        </form>
      </div>
    </div>
  );
}
