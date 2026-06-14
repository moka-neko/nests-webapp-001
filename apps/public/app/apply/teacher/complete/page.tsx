'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/format';
import { getTeacherResult } from '@/lib/teacher-storage';
import type { TeacherApplication } from '@/lib/types';

export default function TeacherCompletePage() {
  const router = useRouter();
  const [data, setData] = useState<TeacherApplication | null>(null);

  useEffect(() => {
    const result = getTeacherResult();
    if (!result) {
      router.replace('/apply/teacher');
      return;
    }
    setData(result);
  }, [router]);

  if (!data) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-center">
      <div className="mb-6 rounded-full bg-green-100 p-4 text-4xl">✓</div>
      <h1 className="mb-4 text-2xl font-bold">応募が完了しました</h1>
      <p className="mb-6 text-slate-600">
        確認メールをお送りしました。メールをご確認ください。
      </p>
      <dl className="mb-8 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm">
        <div className="mb-2">
          <dt className="text-slate-500">応募 ID</dt>
          <dd className="font-medium">{data.id}</dd>
        </div>
        <div className="mb-2">
          <dt className="text-slate-500">応募日時</dt>
          <dd className="font-medium">{formatDateTime(data.submittedAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">メールアドレス</dt>
          <dd className="font-medium">{data.email}</dd>
        </div>
      </dl>
      <Link
        href={`/line-link?email=${encodeURIComponent(data.email)}`}
        className="mb-4 block w-full rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700"
      >
        LINE と連携する
      </Link>
      <Link href="/" className="text-sm text-blue-600">
        トップに戻る
      </Link>
    </div>
  );
}
