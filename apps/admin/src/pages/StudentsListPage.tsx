import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiFetch } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { StudentApplication } from '../lib/types';

export function StudentsListPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiFetch<StudentApplication[]>('/api/v1/students/applications'),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [data, search]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600">読み込みに失敗しました</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">生徒応募一覧</h1>
      <div className="mb-4">
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
                <th className="px-4 py-3 font-medium">電話番号</th>
                <th className="px-4 py-3 font-medium">国籍</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(s.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/students/${s.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.phoneNumber}</td>
                  <td className="px-4 py-3">{s.nationality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
