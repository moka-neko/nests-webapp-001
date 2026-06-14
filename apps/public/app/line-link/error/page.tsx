'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  '400': '認証に失敗しました。もう一度お試しください',
  '404': '応募情報が見つかりません。応募時のメールアドレスをご確認ください',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '400';
  const message =
    searchParams.get('message') ??
    ERROR_MESSAGES[status] ??
    '認証に失敗しました。もう一度お試しください';

  return (
    <div className="text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4 text-4xl">✕</div>
      <h1 className="mb-4 text-2xl font-bold">LINE 連携エラー</h1>
      <p className="mb-8 text-slate-600">{message}</p>
      <Link
        href="/"
        className="block w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
      >
        トップに戻る
      </Link>
    </div>
  );
}

export default function LineLinkErrorPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Suspense fallback={<p className="text-center">読み込み中...</p>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
