export function formatCandidateDateList(
  dates: string[] | null | undefined,
): string {
  if (!dates?.length) return '—';
  return [...dates]
    .sort()
    .map((ymd) => {
      const [, month, day] = ymd.split('-');
      return `${Number(month)}/${Number(day)}`;
    })
    .join('、');
}

export function toTokyoDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
  return formatted.replace(' ', 'T');
}

export function tokyoDateTimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const normalized =
    value.length === 16 ? `${value}:00+09:00` : `${value}+09:00`;
  return new Date(normalized).toISOString();
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(iso))
    .replace(/\//g, '/');
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: '未選考',
  INTERVIEW: '面接実施',
  HIRED: '採用',
  REJECTED: '不採用',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  INTERVIEW: 'bg-blue-100 text-blue-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export const STATUS_CONFIRM_MESSAGES: Record<string, string> = {
  INTERVIEW: '面接案内メールを送信します。よろしいですか？',
  HIRED: '採用通知を送信します。よろしいですか？',
  REJECTED: '不採用通知を送信します。よろしいですか？',
  PENDING: 'ステータスを未選考に戻します。よろしいですか？',
};
