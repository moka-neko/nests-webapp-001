'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { saveTeacherResult } from '@/lib/teacher-storage';
import type { TeacherApplication } from '@/lib/types';

export default function TeacherApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    email: '',
    nameKanji: '',
    nameKatakana: '',
    age: '',
    workLocation: '',
    resumeUrl: '',
    questions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setErrors({});
    setFormError('');
    try {
      const result = await apiFetch<TeacherApplication>(
        '/api/v1/teachers/applications',
        {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            nameKanji: form.nameKanji,
            nameKatakana: form.nameKatakana,
            age: Number(form.age),
            workLocation: form.workLocation,
            resumeUrl: form.resumeUrl,
            questions: form.questions || undefined,
          }),
        },
      );
      saveTeacherResult(result);
      router.push('/apply/teacher/complete');
    } catch (err) {
      if (err instanceof Error && 'fieldErrors' in err) {
        const fe = (err as { fieldErrors?: Record<string, string> }).fieldErrors;
        if (fe) setErrors(fe);
        else setFormError(err.message);
      } else {
        setFormError('送信に失敗しました。時間をおいて再試行してください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">先生応募フォーム</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(
          [
            ['email', 'メールアドレス', 'email'],
            ['nameKanji', 'お名前（漢字）', 'text'],
            ['nameKatakana', 'お名前（カタカナ）', 'text'],
            ['age', '年齢', 'number'],
            ['workLocation', '勤務希望場所', 'text'],
            ['resumeUrl', '履歴書 URL', 'url'],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium">
              {label} <span className="text-red-500">*</span>
            </label>
            <input
              type={type}
              required
              min={key === 'age' ? 18 : undefined}
              max={key === 'age' ? 80 : undefined}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            {errors[key] && (
              <p className="mt-1 text-sm text-red-600">{errors[key]}</p>
            )}
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-medium">質問事項</label>
          <textarea
            value={form.questions}
            onChange={(e) => setForm({ ...form, questions: e.target.value })}
            rows={4}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <span>
            個人情報の取り扱いに同意する
            {process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL && (
              <>
                {' '}
                (
                <a
                  href={process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  プライバシーポリシー
                </a>
                )
              </>
            )}
          </span>
        </label>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={loading || !agreed}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '送信中...' : '応募する'}
        </button>
      </form>
      <Link href="/" className="mt-6 block text-center text-sm text-blue-600">
        トップに戻る
      </Link>
    </div>
  );
}
