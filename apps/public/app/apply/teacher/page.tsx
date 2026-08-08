'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, uploadTeacherPhoto } from '@/lib/api';
import { saveTeacherResult } from '@/lib/teacher-storage';
import type { TeacherApplication } from '@/lib/types';

interface HistoryRow {
  yearMonth: string;
  description: string;
}

const GENDER_OPTIONS = ['男性', '女性', 'その他', '回答しない'] as const;

const emptyRow = (): HistoryRow => ({ yearMonth: '', description: '' });

export default function TeacherApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    email: '',
    nameKanji: '',
    nameKatakana: '',
    age: '',
    workLocation: '',
    questions: '',
  });
  const [resume, setResume] = useState({
    birthDate: '',
    gender: '',
    phoneNumber: '',
    postalCode: '',
    address: '',
    nearestStation: '',
    motivation: '',
    selfPromotion: '',
    hobbies: '',
    requests: '',
  });
  const [education, setEducation] = useState<HistoryRow[]>([emptyRow()]);
  const [workHistory, setWorkHistory] = useState<HistoryRow[]>([emptyRow()]);
  const [qualifications, setQualifications] = useState<HistoryRow[]>([
    emptyRow(),
  ]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0] ?? null;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('JPEG / PNG / WebP 形式の画像を選択してください');
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('ファイルサイズは 5MB 以下にしてください');
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const cleanRows = (rows: HistoryRow[]): HistoryRow[] =>
    rows.filter((row) => row.yearMonth && row.description.trim());

  const buildResumePayload = (photoUrl: string | undefined) => {
    const payload: Record<string, unknown> = {};
    if (photoUrl) payload.photoUrl = photoUrl;
    for (const [key, value] of Object.entries(resume)) {
      if (value.trim()) payload[key] = value.trim();
    }
    const edu = cleanRows(education);
    const work = cleanRows(workHistory);
    const quals = cleanRows(qualifications);
    if (edu.length) payload.education = edu;
    if (work.length) payload.workHistory = work;
    if (quals.length) payload.qualifications = quals;
    return Object.keys(payload).length ? payload : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setErrors({});
    setFormError('');
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadTeacherPhoto(photoFile);
      }
      const result = await apiFetch<TeacherApplication>(
        '/api/v1/teachers/applications',
        {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            nameKanji: form.nameKanji,
            nameKatakana: form.nameKatakana,
            age: Number(form.age),
            workLocation: form.workLocation,
            questions: form.questions || undefined,
            resume: buildResumePayload(photoUrl),
          }),
        },
      );
      saveTeacherResult(result);
      router.push('/apply/teacher/complete');
    } catch (err) {
      if (err instanceof Error && 'fieldErrors' in err) {
        const fe = (err as { fieldErrors?: Record<string, string> }).fieldErrors;
        if (fe) setErrors(fe);
        else setFormError(err.message);
      } else {
        setFormError('送信に失敗しました。時間をおいて再試行してください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">先生応募フォーム</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h2 className="border-b border-slate-200 pb-2 text-lg font-semibold">
            基本情報
          </h2>
          {(
            [
              ['email', 'メールアドレス', 'email'],
              ['nameKanji', 'お名前（漢字）', 'text'],
              ['nameKatakana', 'お名前（カタカナ）', 'text'],
              ['age', '年齢', 'number'],
              ['workLocation', '勤務希望場所', 'text'],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type={type}
                required
                min={key === 'age' ? 18 : undefined}
                max={key === 'age' ? 80 : undefined}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
              {errors[key] && (
                <p className="mt-1 text-sm text-red-600">{errors[key]}</p>
              )}
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-slate-200 pb-2 text-lg font-semibold">
            履歴書
          </h2>
          <p className="text-sm text-slate-500">
            履歴書の内容をフォームに直接ご入力ください（任意項目）。
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">顔写真</label>
            <div className="flex items-start gap-4">
              <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-slate-300 bg-slate-50">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="顔写真プレビュー"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-1 text-center text-xs text-slate-400">
                    写真
                    <br />
                    プレビュー
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-slate-500">
                  JPEG / PNG / WebP、5MB まで
                </p>
                {photoError && (
                  <p className="text-sm text-red-600">{photoError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">生年月日</label>
              <input
                type="date"
                value={resume.birthDate}
                onChange={(e) =>
                  setResume({ ...resume, birthDate: e.target.value })
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">性別</label>
              <select
                value={resume.gender}
                onChange={(e) =>
                  setResume({ ...resume, gender: e.target.value })
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="">選択しない</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">電話番号</label>
              <input
                type="tel"
                value={resume.phoneNumber}
                onChange={(e) =>
                  setResume({ ...resume, phoneNumber: e.target.value })
                }
                placeholder="090-1234-5678"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">郵便番号</label>
              <input
                type="text"
                value={resume.postalCode}
                onChange={(e) =>
                  setResume({ ...resume, postalCode: e.target.value })
                }
                placeholder="150-0002"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">現住所</label>
            <input
              type="text"
              value={resume.address}
              onChange={(e) =>
                setResume({ ...resume, address: e.target.value })
              }
              placeholder="東京都渋谷区渋谷1-2-3"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">最寄り駅</label>
            <input
              type="text"
              value={resume.nearestStation}
              onChange={(e) =>
                setResume({ ...resume, nearestStation: e.target.value })
              }
              placeholder="JR山手線 渋谷駅"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <HistorySection
            label="学歴"
            rows={education}
            onChange={setEducation}
            placeholder="○○大学 教育学部 入学"
          />
          <HistorySection
            label="職歴"
            rows={workHistory}
            onChange={setWorkHistory}
            placeholder="株式会社○○ 入社"
          />
          <HistorySection
            label="免許・資格"
            rows={qualifications}
            onChange={setQualifications}
            placeholder="中学校教諭一種免許状（数学） 取得"
          />

          {(
            [
              ['motivation', '志望動機'],
              ['selfPromotion', '自己PR'],
              ['hobbies', '趣味・特技'],
              ['requests', '本人希望記入欄'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <textarea
                value={resume[key]}
                onChange={(e) =>
                  setResume({ ...resume, [key]: e.target.value })
                }
                rows={key === 'hobbies' ? 2 : 4}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">質問事項</label>
            <textarea
              value={form.questions}
              onChange={(e) => setForm({ ...form, questions: e.target.value })}
              rows={4}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span>
              個人情報の取り扱いに同意する
              {process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL && (
                <>
                  {' '}
                  (
                  <a
                    href={process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    プライバシーポリシー
                  </a>
                  )
                </>
              )}
            </span>
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '送信中...' : '応募する'}
          </button>
        </section>
      </form>
      <Link href="/" className="mt-6 block text-center text-sm text-blue-600">
        トップに戻る
      </Link>
    </div>
  );
}

function HistorySection({
  label,
  rows,
  onChange,
  placeholder,
}: {
  label: string;
  rows: HistoryRow[];
  onChange: (rows: HistoryRow[]) => void;
  placeholder: string;
}) {
  const updateRow = (index: number, patch: Partial<HistoryRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="month"
              value={row.yearMonth}
              onChange={(e) => updateRow(index, { yearMonth: e.target.value })}
              className="w-40 rounded border border-slate-300 px-3 py-2"
              aria-label={`${label} 年月`}
            />
            <input
              type="text"
              value={row.description}
              onChange={(e) =>
                updateRow(index, { description: e.target.value })
              }
              placeholder={placeholder}
              className="flex-1 rounded border border-slate-300 px-3 py-2"
              aria-label={`${label} 内容`}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              disabled={rows.length === 1}
              className="shrink-0 rounded border border-slate-300 px-2 py-2 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              aria-label={`${label} 行を削除`}
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, emptyRow()])}
        className="mt-2 rounded border border-blue-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
      >
        ＋ 行を追加
      </button>
    </div>
  );
}
