import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="mb-1 text-lg font-medium text-slate-700">
          友達先生日本語会話教室
        </p>
        <h1 className="mb-2 text-3xl font-bold">応募フォーム</h1>
        <p className="mb-8 text-slate-600">ご応募はこちらからお願いします</p>
        <div className="space-y-4">
          <Link
            href="/apply/teacher"
            className="block w-full rounded-lg bg-blue-600 py-4 text-lg font-medium text-white hover:bg-blue-700"
          >
            先生として応募する
          </Link>
          <Link
            href="/apply/student"
            className="block w-full rounded-lg border border-blue-600 py-4 text-lg font-medium text-blue-600 hover:bg-blue-50"
          >
            生徒として応募する
          </Link>
        </div>
      </div>
    </div>
  );
}
