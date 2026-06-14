'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/format';
import type { StudentApplication } from '@/lib/types';

const STORAGE_KEY = 'student_application_result';

export default function StudentCompletePage() {
  const router = useRouter();
  const [data, setData] = useState<StudentApplication | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      router.replace('/apply/student');
      return;
    }
    try {
      setData(JSON.parse(raw) as StudentApplication);
    } catch {
      router.replace('/apply/student');
    }
  }, [router]);

  if (!data) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-center">
      <div className="mb-6 rounded-full bg-green-100 p-4 text-4xl">✓</div>
      <h1 className="mb-4 text-2xl font-bold">応募が完了しました</h1>
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
          <dt className="text-slate-500">氏名</dt>
          <dd className="font-medium">{data.name}</dd>
        </div>
      </dl>
      <Link
        href="/"
        className="block w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
      >
        トップに戻る
      </Link>
    </div>
  );
}
