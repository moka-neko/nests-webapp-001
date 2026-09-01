'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getLineLoginUrl } from '@/lib/api';

function LineLinkContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const applicationId = searchParams.get('applicationId') ?? '';

  if (!email) {
    return (
      <div className="text-center">
        <p className="mb-4 text-red-600">
          メールアドレスが指定されていません。応募完了画面または確認メールのリンクからお進みください。
        </p>
        <Link href="/" className="text-blue-600">
          トップに戻る
        </Link>
      </div>
    );
  }

  const handleLineLink = () => {
    window.location.href = getLineLoginUrl(email, applicationId || undefined);
  };

  return (
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold">LINE で選考連絡を受け取る</h1>
      <p className="mb-2 text-slate-600">
        下のボタンから LINE
        ログインを進めてください。認可の途中で、公式アカウントの友だち追加も案内されます。
      </p>
      <p className="mb-6 text-sm text-slate-500">対象メール: {email}</p>
      <button
        type="button"
        onClick={handleLineLink}
        className="w-full rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700"
      >
        LINEで続ける
      </button>
      <Link href="/" className="mt-6 block text-sm text-blue-600">
        後で登録する（トップに戻る）
      </Link>
    </div>
  );
}

export default function LineLinkPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Suspense fallback={<p className="text-center">読み込み中...</p>}>
        <LineLinkContent />
      </Suspense>
    </div>
  );
}
