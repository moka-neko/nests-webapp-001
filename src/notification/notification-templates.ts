/** 旧 GAS「メール本文」シートに対応するメールテンプレート */

export const MAIL_SUBJECTS = {
  teacherHired: '【採用のお知らせ】',
  teacherRejected: '【選考結果のお知らせ】',
  teacherInterview: '【面接のご案内】',
  teacherApplicationConfirmation: '【応募受付完了】',
  teacherInterviewInvitation: '【面接日程のご案内】',
  weeklyInterviewReminder: '【面接日程の編集のお願い】',
} as const;

export function buildTeacherHiredMailBody(): string {
  return 'この度は採用が決定いたしました。詳細は追ってご連絡いたします。';
}

export function buildTeacherRejectedMailBody(): string {
  return 'この度はご応募いただきありがとうございました。選考の結果、今回は見送らせていただくこととなりました。';
}

export function buildTeacherInterviewMailBody(email: string): string {
  return `${email} 様\n\n面接のご案内をお送りします。日程調整用のリンクをご確認ください。`;
}

export function buildTeacherApplicationConfirmationBody(email: string): string {
  return `${email} 様\n\nご応募ありがとうございます。応募を受け付けました。`;
}

/** LINE 通知テンプレート */

export function buildOperatorTeacherApplicationMessage(
  nameKanji: string,
  email: string,
  resumeUrl: string,
  interviewCandidateDates: string[] = [],
): string {
  const lines = [
    '【新規先生応募】',
    `氏名: ${nameKanji}`,
    `メール: ${email}`,
    `履歴書: ${resumeUrl}`,
  ];
  if (interviewCandidateDates.length > 0) {
    lines.push(`面接候補日: ${interviewCandidateDates.join(', ')}`);
  }
  return lines.join('\n');
}

export const WEEKLY_INTERVIEW_REMINDER_HEADER =
  '今週の面接日程を日曜日までに編集をお願いいたします。';

/**
 * 毎週月曜の面接日程リマインド（グループLINE・メール共通の本文）。
 * URL は1つで、開いた先の管理画面で担当する応募者を選んで編集画面へ移る。
 */
export function buildWeeklyInterviewReminderMessage(
  scheduleUrl: string,
): string {
  return `${WEEKLY_INTERVIEW_REMINDER_HEADER}\n面接日程調整URL\n${scheduleUrl}`;
}

/** 管理画面の「面接日程調整」ページ（対象週の応募者一覧）の URL */
export function buildAdminInterviewScheduleUrl(
  adminBaseUrl: string,
  weekStart: string,
): string {
  const base = adminBaseUrl.replace(/\/+$/, '');
  return `${base}/interviews?week=${weekStart}`;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 例: 2026年10月21日(水) 14:00（日本時間） */
export function formatTokyoDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const weekdayIndex = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ].indexOf(get('weekday'));
  return `${get('year')}年${get('month')}月${get('day')}日(${WEEKDAY_LABELS[weekdayIndex]}) ${get('hour')}:${get('minute')}`;
}

/** 面接日時と Google Meet URL の案内（応募者向けメール本文） */
export function buildInterviewInvitationMailBody(
  nameKanji: string,
  scheduledAt: Date,
  meetingUrl: string,
): string {
  return [
    `${nameKanji} 様`,
    '',
    'この度はご応募いただきありがとうございます。',
    '面接の日程が決まりましたのでご案内いたします。',
    '',
    `日時: ${formatTokyoDateTime(scheduledAt)}`,
    `参加URL（Google Meet）: ${meetingUrl}`,
    '',
    '当日は上記URLからご参加ください。',
  ].join('\n');
}

/** 面接日時と Google Meet URL の案内（応募者向け LINE） */
export function buildInterviewInvitationLineMessage(
  nameKanji: string,
  scheduledAt: Date,
  meetingUrl: string,
): string {
  return `${nameKanji}さん\n面接の日程が決まりました。\n日時: ${formatTokyoDateTime(scheduledAt)}\n当日は以下のURLからご参加ください。\n${meetingUrl}`;
}

/** 面接日時と Google Meet URL の共有（運営グループ LINE） */
export function buildOperatorInterviewInvitationMessage(
  nameKanji: string,
  scheduledAt: Date,
  meetingUrl: string,
): string {
  return `【面接URL発行】\n${nameKanji}さんの面接URLを発行し、応募者へ通知しました。\n日時: ${formatTokyoDateTime(scheduledAt)}\n参加URL: ${meetingUrl}`;
}

export function buildOperatorStudentApplicationMessage(
  name: string,
  email: string,
  phoneNumber: string,
  desiredLessonsPerWeek?: number | null,
): string {
  const lines = [
    '【新規生徒応募】',
    `氏名: ${name}`,
    `メール: ${email}`,
    `電話: ${phoneNumber}`,
  ];
  if (desiredLessonsPerWeek) {
    lines.push(`受講希望回数: 週${desiredLessonsPerWeek}回`);
  }
  return lines.join('\n');
}

export function buildTeacherHiredLineMessage(): string {
  return '採用が決定しました。おめでとうございます。詳細はメールをご確認ください。';
}

export function buildTeacherRejectedLineMessage(): string {
  return '選考結果についてメールをお送りしました。ご確認ください。';
}

export function buildInterviewMeetingLineMessage(
  guestName: string,
  meetingUrl: string,
): string {
  return `${guestName}さん\n面接の日程調整ありがとうございます。\n当日は以下のURLからご参加ください。\n${meetingUrl}`;
}

export function buildOperatorInterviewScheduledMessage(
  guestName: string,
  meetingUrl: string,
): string {
  return `【面接予約完了】\n${guestName}さんとの面接が予約されました。\n参加URL: ${meetingUrl}`;
}
