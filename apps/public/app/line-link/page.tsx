'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getLineLoginUrl } from '@/lib/api';

function LineLinkContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  if (!email) {
    return (
      <div className="text-center">
        <p className="mb-4 text-red-600">
          メールアドレスが指定されていません。応募完了画面からお進みください。
        </p>
        <Link href="/" className="text-blue-600">
          トップに戻る
        </Link>
      </div>
    );
  }

  const handleLineLink = () => {
    window.location.href = getLineLoginUrl(email);
  };

  return (
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold">LINE 連携</h1>
      <p className="mb-2 text-slate-600">
        選考に関するご連絡を LINE でお届けするため、LINE アカウントとの連携をお願いします。
      </p>
      <p className="mb-8 text-sm text-slate-500">対象メール: {email}</p>
      <button
        type="button"
        onClick={handleLineLink}
        className="w-full rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700"
      >
        LINE で連携する
      </button>
      <Link href="/" className="mt-6 block text-sm text-blue-600">
        後で連携する（トップに戻る）
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
