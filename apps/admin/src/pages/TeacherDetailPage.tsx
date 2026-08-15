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
  const [meetingUrlInput, setMeetingUrlInput] = useState('');
  const [meetingUrlConfirmOpen, setMeetingUrlConfirmOpen] = useState(false);
  const [meetingUrlError, setMeetingUrlError] = useState('');

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

  const meetingUrlMutation = useMutation({
    mutationFn: (meetingUrl: string) =>
      apiFetch<TeacherApplication>(
        `/api/v1/teachers/applications/${id}/meeting-url`,
        {
          method: 'PATCH',
          body: JSON.stringify({ meetingUrl }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setMeetingUrlConfirmOpen(false);
      setMeetingUrlInput('');
      setMeetingUrlError('');
    },
    onError: (err: Error) => {
      setMeetingUrlConfirmOpen(false);
      setMeetingUrlError(err.message || '面接URLの登録に失敗しました');
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

  const handleMeetingUrlSubmit = () => {
    const trimmed = meetingUrlInput.trim();
    if (!trimmed) {
      setMeetingUrlError('Google Meet URL を入力してください');
      return;
    }
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setMeetingUrlError('http または https の URL を入力してください');
        return;
      }
    } catch {
      setMeetingUrlError('有効な URL を入力してください');
      return;
    }
    setMeetingUrlError('');
    setMeetingUrlConfirmOpen(true);
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
            label="履歴書 URL（旧形式）"
            value={
              data.resumeUrl ? (
                <a
                  href={data.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {data.resumeUrl}
                </a>
              ) : (
                '—'
              )
            }
          />
          <Field label="質問事項" value={data.questions ?? '—'} className="sm:col-span-2" />
        </dl>
      </div>

      {data.resume && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">履歴書</h2>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="shrink-0">
              {data.resume.photoUrl ? (
                <a href={data.resume.photoUrl} target="_blank" rel="noreferrer">
                  <img
                    src={data.resume.photoUrl}
                    alt={`${data.nameKanji} の顔写真`}
                    className="h-40 w-32 rounded border border-slate-200 object-cover"
                  />
                </a>
              ) : (
                <div className="flex h-40 w-32 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                  写真なし
                </div>
              )}
            </div>
            <dl className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="生年月日" value={data.resume.birthDate ?? '—'} />
              <Field label="性別" value={data.resume.gender ?? '—'} />
              <Field label="電話番号" value={data.resume.phoneNumber ?? '—'} />
              <Field label="郵便番号" value={data.resume.postalCode ?? '—'} />
              <Field
                label="現住所"
                value={data.resume.address ?? '—'}
                className="sm:col-span-2"
              />
              <Field
                label="最寄り駅"
                value={data.resume.nearestStation ?? '—'}
                className="sm:col-span-2"
              />
            </dl>
          </div>
          <div className="mt-6 space-y-4">
            <HistoryList label="学歴" entries={data.resume.education} />
            <HistoryList label="職歴" entries={data.resume.workHistory} />
            <HistoryList label="免許・資格" entries={data.resume.qualifications} />
          </div>
          <dl className="mt-6 grid gap-3">
            <Field label="志望動機" value={data.resume.motivation ?? '—'} />
            <Field label="自己PR" value={data.resume.selfPromotion ?? '—'} />
            <Field label="趣味・特技" value={data.resume.hobbies ?? '—'} />
            <Field label="本人希望記入欄" value={data.resume.requests ?? '—'} />
          </dl>
        </div>
      )}

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
                '未登録'
              )
            }
          />
        </dl>

        <div className="mb-6 border-t border-slate-100 pt-6">
          <h3 className="mb-2 text-sm font-medium">Google Meet URL の登録</h3>
          <p className="mb-3 text-sm text-slate-500">
            面接用の Google Meet URL を登録すると、応募者へメールおよび LINE（連携済みの場合）で通知します。
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <label htmlFor="meeting-url" className="mb-1 block text-sm font-medium">
                Google Meet URL
              </label>
              <input
                id="meeting-url"
                type="url"
                value={meetingUrlInput}
                onChange={(e) => {
                  setMeetingUrlInput(e.target.value);
                  if (meetingUrlError) setMeetingUrlError('');
                }}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleMeetingUrlSubmit}
              disabled={meetingUrlMutation.isPending}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {data.meetingUrl ? 'URLを更新して通知' : 'URLを登録して通知'}
            </button>
          </div>
          {meetingUrlError && (
            <p className="mt-2 text-sm text-red-600">{meetingUrlError}</p>
          )}
          {meetingUrlMutation.isSuccess && !meetingUrlConfirmOpen && (
            <p className="mt-2 text-sm text-green-700">
              面接URLを登録し、通知を送信しました。
            </p>
          )}
        </div>

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
        open={meetingUrlConfirmOpen}
        message="面接用 Google Meet URL を登録し、応募者へメールおよび LINE で通知します。よろしいですか？"
        loading={meetingUrlMutation.isPending}
        onConfirm={() => meetingUrlMutation.mutate(meetingUrlInput.trim())}
        onCancel={() => setMeetingUrlConfirmOpen(false)}
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

function HistoryList({
  label,
  entries,
}: {
  label: string;
  entries: { yearMonth: string; description: string }[] | null;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      {entries && entries.length > 0 ? (
        <table className="mt-1 w-full text-sm">
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="w-28 py-1 pr-4 text-slate-500">
                  {entry.yearMonth}
                </td>
                <td className="py-1">{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-1 text-sm">—</p>
      )}
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
