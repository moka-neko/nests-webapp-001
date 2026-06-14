'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { StudentApplication } from '@/lib/types';

const STORAGE_KEY = 'student_application_result';

export function saveStudentResult(data: StudentApplication) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function StudentApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    email: '',
    name: '',
    phoneNumber: '',
    nationality: '',
    questions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError('');
    try {
      const result = await apiFetch<StudentApplication>(
        '/api/v1/students/applications',
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            questions: form.questions || undefined,
          }),
        },
      );
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      router.push('/apply/student/complete');
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
      <h1 className="mb-6 text-2xl font-bold">生徒応募フォーム</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(
          [
            ['email', 'メールアドレス', 'email'],
            ['name', '氏名', 'text'],
            ['phoneNumber', '電話番号', 'tel'],
            ['nationality', '国籍', 'text'],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium">
              {label} <span className="text-red-500">*</span>
            </label>
            <input
              type={type}
              required
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
          <label className="mb-1 block text-sm font-medium">質問・相談内容</label>
          <textarea
            value={form.questions}
            onChange={(e) => setForm({ ...form, questions: e.target.value })}
            rows={4}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={loading}
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
