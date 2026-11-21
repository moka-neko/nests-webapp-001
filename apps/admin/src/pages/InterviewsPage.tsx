import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';
import {
  addDaysToYmd,
  formatDateTime,
  formatYmdWithWeekday,
} from '../lib/format';
import type { WeeklyInterviews } from '../lib/types';

/**
 * 面接日程調整ページ。
 * 毎週月曜のグループLINE・メールの通知URL（/interviews?week=YYYY-MM-DD）の遷移先。
 * 担当する応募者を選んで、その応募者の面接編集画面へ移る。
 */
export function InterviewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const week = searchParams.get('week') ?? '';
  const [selectedId, setSelectedId] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['teachers', 'weekly-interviews', week],
    queryFn: () =>
      apiFetch<WeeklyInterviews>(
        `/api/v1/teachers/applications/weekly-interviews${week ? `?week=${encodeURIComponent(week)}` : ''}`,
      ),
  });

  const moveWeek = (days: number) => {
    if (!data) return;
    setSelectedId('');
    setSearchParams({ week: addDaysToYmd(data.weekStart, days) });
  };

  const goToEdit = (id: string) => navigate(`/teachers/${id}/edit#interview`);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) {
    return <p className="text-red-600">読み込みに失敗しました</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">面接日程調整</h1>
      <p className="mb-6 text-sm text-slate-600">
        今週の面接日程を日曜日までに編集をお願いいたします。担当する応募者を選んで編集画面へ進んでください。
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => moveWeek(-7)}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        >
          ← 前の週
        </button>
        <span className="font-medium">
          {formatYmdWithWeekday(data.weekStart)} 〜{' '}
          {formatYmdWithWeekday(data.weekEnd)}
        </span>
        <button
          type="button"
          onClick={() => moveWeek(7)}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        >
          次の週 →
        </button>
        {week && (
          <button
            type="button"
            onClick={() => {
              setSelectedId('');
              setSearchParams({});
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            今週に戻る
          </button>
        )}
      </div>

      {data.applications.length === 0 ? (
        <p className="text-slate-600">
          この週に面接候補日がある応募者はいません
        </p>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedId) goToEdit(selectedId);
            }}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <label
                htmlFor="interview-applicant"
                className="mb-1 block text-sm font-medium"
              >
                担当する応募者
              </label>
              <select
                id="interview-applicant"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="min-w-64 rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">選択してください</option>
                {data.applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nameKanji}（候補日 {formatYmdWithWeekday(a.earliestCandidateDate)}〜）
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedId}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              編集画面へ
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium">氏名</th>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                  <th className="px-4 py-3 font-medium">面接候補日</th>
                  <th className="px-4 py-3 font-medium">確定面接日時</th>
                  <th className="px-4 py-3 font-medium">面接 URL</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.applications.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/teachers/${a.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {a.nameKanji}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      {[...a.interviewCandidateDates]
                        .sort()
                        .map(formatYmdWithWeekday)
                        .join('、')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.interviewScheduledAt
                        ? formatDateTime(a.interviewScheduledAt)
                        : '未確定'}
                    </td>
                    <td className="px-4 py-3">
                      {a.meetingUrl ? '発行済み' : '未発行'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => goToEdit(a.id)}
                        className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100"
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
