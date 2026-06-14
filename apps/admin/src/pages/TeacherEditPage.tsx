import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch } from '../lib/api';
import type { TeacherApplication } from '../lib/types';

export function TeacherEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => apiFetch<TeacherApplication>(`/api/v1/teachers/applications/${id}`),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    nameKanji: '',
    nameKatakana: '',
    age: 0,
    workLocation: '',
    resumeUrl: '',
    questions: '',
  });

  useEffect(() => {
    if (data) {
      setForm({
        nameKanji: data.nameKanji,
        nameKatakana: data.nameKatakana,
        age: data.age,
        workLocation: data.workLocation,
        resumeUrl: data.resumeUrl,
        questions: data.questions ?? '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<TeacherApplication>(`/api/v1/teachers/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          questions: form.questions || undefined,
        }),
      }),
    onSuccess: () => navigate(`/teachers/${id}`),
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) {
    return <p className="text-red-600">指定の応募が見つかりません</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">先生応募編集</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">メールアドレス</label>
          <input
            type="email"
            value={data.email}
            disabled
            className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
          />
        </div>
        {(
          [
            ['nameKanji', 'お名前（漢字）'],
            ['nameKatakana', 'お名前（カタカナ）'],
            ['workLocation', '勤務希望場所'],
            ['resumeUrl', '履歴書 URL'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input
              type="text"
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-medium">年齢</label>
          <input
            type="number"
            required
            min={18}
            max={80}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">質問事項</label>
          <textarea
            value={form.questions}
            onChange={(e) => setForm({ ...form, questions: e.target.value })}
            rows={4}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? '保存中...' : '保存'}
          </button>
          <Link
            to={`/teachers/${id}`}
            className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
