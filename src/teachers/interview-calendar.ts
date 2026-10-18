/**
 * 面接候補日の表示期間。
 *
 * 仕様例: 2026-10-04 に入力した場合は 2026-10-19〜2026-10-25。
 * 「次の次の月曜日」は数え方で 10/12 にも 10/19 にも読めるため、提示された日付例に合わせる。
 *
 * ルール（Asia/Tokyo の暦日）:
 * 入力日の 14 日後以降で最初の月曜日を起点に、その週の日曜まで（月曜〜日曜の 7 日間）。
 * 2026-10-04（日）の 14 日後は 2026-10-18（日）なので、起点は 2026-10-19（月）。
 */

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export interface InterviewCandidateDateOption {
  date: string;
  label: string;
}

export interface InterviewCandidateWindow {
  startDate: string;
  endDate: string;
  dates: InterviewCandidateDateOption[];
}

export function toTokyoYmd(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isValidYmd(ymd: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function addDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 0 = 日曜 … 6 = 土曜 */
export function weekdayIndex(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function formatCandidateLabel(ymd: string): string {
  const [, month, day] = ymd.split('-');
  return `${Number(month)}/${Number(day)}（${WEEKDAY_LABELS[weekdayIndex(ymd)]}）`;
}

/** ymd 当日が月曜ならその日、それ以外は次の月曜 */
export function mondayOnOrAfter(ymd: string): string {
  const day = weekdayIndex(ymd);
  if (day === 1) return ymd;
  const add = day === 0 ? 1 : 8 - day;
  return addDays(ymd, add);
}

export function getInterviewCandidateWindow(
  now: Date = new Date(),
): InterviewCandidateWindow {
  const startDate = mondayOnOrAfter(addDays(toTokyoYmd(now), 14));
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index);
    return { date, label: formatCandidateLabel(date) };
  });
  return {
    startDate,
    endDate: dates[6].date,
    dates,
  };
}

/** 指定日時が属する週（月曜〜日曜）の日付 */
export function getTokyoWeekDates(now: Date = new Date()): string[] {
  const today = toTokyoYmd(now);
  const day = weekdayIndex(today);
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = addDays(today, -daysFromMonday);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function normalizeInterviewCandidateDates(
  dates: string[],
  now: Date = new Date(),
): { dates: string[] } | { error: string } {
  const unique = [...new Set(dates)].sort();
  if (unique.some((date) => !isValidYmd(date))) {
    return { error: '面接候補日の日付形式が不正です' };
  }

  const window = getInterviewCandidateWindow(now);
  const allowed = new Set(window.dates.map((option) => option.date));
  if (unique.some((date) => !allowed.has(date))) {
    return {
      error: `面接候補日は ${formatCandidateLabel(window.startDate)} から ${formatCandidateLabel(window.endDate)} の期間で選択してください`,
    };
  }

  return { dates: unique };
}

export function normalizeEditableCandidateDates(
  dates: string[],
): { dates: string[] } | { error: string } {
  const unique = [...new Set(dates)].sort();
  if (unique.some((date) => !isValidYmd(date))) {
    return { error: '面接候補日の日付形式が不正です' };
  }
  return { dates: unique };
}
