import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { TeacherApplication, TeacherStatus } from '../lib/types';

export function TeachersListPage() {
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiFetch<TeacherApplication[]>('/api/v1/teachers/applications'),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.nameKanji.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, statusFilter, search]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600">読み込みに失敗しました</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">先生応募一覧</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TeacherStatus | 'ALL')}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">すべてのステータス</option>
          <option value="PENDING">未選考</option>
          <option value="INTERVIEW">面接実施</option>
          <option value="HIRED">採用</option>
          <option value="REJECTED">不採用</option>
        </select>
        <input
          type="search"
          placeholder="氏名・メールで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-slate-600">応募はまだありません</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium">応募日時</th>
                <th className="px-4 py-3 font-medium">氏名</th>
                <th className="px-4 py-3 font-medium">メール</th>
                <th className="px-4 py-3 font-medium">年齢</th>
                <th className="px-4 py-3 font-medium">勤務地</th>
                <th className="px-4 py-3 font-medium">ステータス</th>
                <th className="px-4 py-3 font-medium">LINE</th>
                <th className="px-4 py-3 font-medium">面接 URL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(t.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/teachers/${t.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {t.nameKanji}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{t.email}</td>
                  <td className="px-4 py-3">{t.age}</td>
                  <td className="px-4 py-3">{t.workLocation}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    {t.lineUserId ? '連携済み' : '未連携'}
                  </td>
                  <td className="px-4 py-3">
                    {t.meetingUrl ? (
                      <a
                        href={t.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        リンク
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
