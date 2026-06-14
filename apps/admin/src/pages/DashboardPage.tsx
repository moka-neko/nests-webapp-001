import { Link } from 'react-router-dom';

export function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">ダッシュボード</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/teachers"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300"
        >
          <h2 className="text-lg font-medium">先生応募一覧</h2>
          <p className="mt-2 text-sm text-slate-600">先生の応募を閲覧・選考管理</p>
        </Link>
        <Link
          to="/students"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300"
        >
          <h2 className="text-lg font-medium">生徒応募一覧</h2>
          <p className="mt-2 text-sm text-slate-600">生徒の応募を閲覧・編集</p>
        </Link>
        <Link
          to="/settings"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300"
        >
          <h2 className="text-lg font-medium">アカウント設定</h2>
          <p className="mt-2 text-sm text-slate-600">MFA の設定・変更</p>
        </Link>
      </div>
    </div>
  );
}
