export function formatCandidateDates(dates: string[] | undefined): string {
  if (!dates?.length) return '';
  return [...dates]
    .sort()
    .map((ymd) => {
      const [, month, day] = ymd.split('-');
      return `${Number(month)}/${Number(day)}`;
    })
    .join('、');
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
  }).format(new Date(iso));
}
