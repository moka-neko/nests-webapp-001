import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';
import { formatDateTime, STATUS_CONFIRM_MESSAGES } from '../lib/format';
import type { TeacherApplication, TeacherStatus } from '../lib/types';

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<TeacherStatus | ''>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => apiFetch<TeacherApplication>(`/api/v1/teachers/applications/${id}`),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: TeacherStatus) =>
      apiFetch<TeacherApplication>(`/api/v1/teachers/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setConfirmOpen(false);
      setNewStatus('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/v1/teachers/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => navigate('/teachers'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div>
        <p className="text-red-600">指定の応募が見つかりません</p>
        <Link to="/teachers" className="mt-4 inline-block text-blue-600">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const handleStatusChange = () => {
    if (!newStatus || newStatus === data.status) return;
    setConfirmOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">先生応募詳細</h1>
        <div className="flex gap-2">
          <Link
            to={`/teachers/${id}/edit`}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            編集
          </Link>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">基本情報</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="応募 ID" value={data.id} />
          <Field label="応募日時" value={formatDateTime(data.submittedAt)} />
          <Field label="最終更新" value={formatDateTime(data.updatedAt)} />
          <Field label="メールアドレス" value={data.email} />
          <Field label="お名前（漢字）" value={data.nameKanji} />
          <Field label="お名前（カタカナ）" value={data.nameKatakana} />
          <Field label="年齢" value={String(data.age)} />
          <Field label="勤務希望場所" value={data.workLocation} />
          <Field
            label="履歴書"
            value={
              <a
                href={data.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {data.resumeUrl}
              </a>
            }
          />
          <Field label="質問事項" value={data.questions ?? '—'} className="sm:col-span-2" />
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">選考・連携情報</h2>
        <dl className="mb-6 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">選考ステータス</dt>
            <dd className="mt-1">
              <StatusBadge status={data.status} />
            </dd>
          </div>
          <Field label="LINE 表示名" value={data.lineDisplayName ?? '—'} />
          <Field label="LINE userId" value={data.lineUserId ?? '—'} />
          <Field
            label="面接 URL"
            value={
              data.meetingUrl ? (
                <a
                  href={data.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {data.meetingUrl}
                </a>
              ) : (
                '—'
              )
            }
          />
        </dl>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">ステータス変更</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TeacherStatus)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              <option value="PENDING">未選考</option>
              <option value="INTERVIEW">面接実施</option>
              <option value="HIRED">採用</option>
              <option value="REJECTED">不採用</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleStatusChange}
            disabled={!newStatus || newStatus === data.status}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            変更
          </button>
        </div>
      </div>

      <Link to="/teachers" className="mt-6 inline-block text-blue-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <ConfirmDialog
        open={confirmOpen}
        message={STATUS_CONFIRM_MESSAGES[newStatus] ?? ''}
        loading={statusMutation.isPending}
        onConfirm={() => newStatus && statusMutation.mutate(newStatus)}
        onCancel={() => setConfirmOpen(false)}
      />

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

function Field({
  label,
  value,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 break-all">{value}</dd>
    </div>
  );
}
