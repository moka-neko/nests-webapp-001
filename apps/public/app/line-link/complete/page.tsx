'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AddOfficialAccount } from '@/components/AddOfficialAccount';
import { resolveAddFriendUrl } from '@/lib/line-add-friend';

function CompleteContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') ?? 'LINE連携が完了しました。';
  const lineDisplayName = searchParams.get('lineDisplayName');
  const friendFlag = searchParams.get('friendFlag') === 'true';
  const addFriendUrl = resolveAddFriendUrl(searchParams.get('addFriendUrl'));

  return (
    <div className="text-center">
      <div className="mb-6 rounded-full bg-green-100 p-4 text-4xl">✓</div>
      <h1 className="mb-4 text-2xl font-bold">LINE 連携完了</h1>
      <p className="mb-4 text-slate-600">{message}</p>
      {lineDisplayName && (
        <p className="mb-4 text-sm text-slate-500">
          LINE 表示名: {lineDisplayName}
        </p>
      )}
      {friendFlag ? (
        <p className="mb-8 text-sm text-slate-600">
          公式 LINE
          の友だち追加も完了しています。選考のご連絡をお送りします。
        </p>
      ) : (
        <AddOfficialAccount addFriendUrl={addFriendUrl} />
      )}
      <Link
        href="/"
        className="block w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
      >
        トップに戻る
      </Link>
    </div>
  );
}

export default function LineLinkCompletePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Suspense fallback={<p className="text-center">読み込み中...</p>}>
        <CompleteContent />
      </Suspense>
    </div>
  );
}
