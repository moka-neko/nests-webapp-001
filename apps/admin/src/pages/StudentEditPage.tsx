import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch } from '../lib/api';
import type { StudentApplication } from '../lib/types';

export function StudentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const list = await apiFetch<StudentApplication[]>('/api/v1/students/applications');
      const found = list.find((s) => s.id === id);
      if (!found) throw new Error('Not found');
      return found;
    },
    enabled: !!id,
  });

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    nationality: '',
    questions: '',
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        phoneNumber: data.phoneNumber,
        nationality: data.nationality,
        questions: data.questions ?? '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<StudentApplication>(`/api/v1/students/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          questions: form.questions || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/v1/students/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => navigate('/students'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) {
    return (
      <div>
        <p className="text-red-600">指定の応募が見つかりません</p>
        <Link to="/students" className="mt-4 inline-block text-blue-600">
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">生徒応募編集</h1>
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
        <div>
          <label className="mb-1 block text-sm font-medium">氏名</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">電話番号</label>
          <input
            type="tel"
            required
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">国籍</label>
          <input
            type="text"
            required
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">質問・相談内容</label>
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
            to="/students"
            className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            キャンセル
          </Link>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="ml-auto rounded border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        message="この応募を削除します。よろしいですか？"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
