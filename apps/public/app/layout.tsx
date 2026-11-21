import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '友達先生日本語会話教室 応募フォーム',
  description: '友達先生日本語会話教室の先生・生徒の応募受付',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
