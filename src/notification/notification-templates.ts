/** 旧 GAS「メール本文」シートに対応するメールテンプレート */

export const MAIL_SUBJECTS = {
  teacherHired: '【採用のお知らせ】',
  teacherRejected: '【選考結果のお知らせ】',
  teacherInterview: '【面接のご案内】',
  teacherApplicationConfirmation: '【応募受付完了】',
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

const LINE_TEXT_LIMIT = 4800;

export function buildWeeklyInterviewReminderMessages(
  applicants: { nameKanji: string; editUrl: string }[],
): string[] {
  const header = '今週の面接日程を日曜日までに編集をお願いいたします。';
  const blocks = applicants.map(
    (applicant) => `${applicant.nameKanji}\n${applicant.editUrl}`,
  );
  const messages: string[] = [];
  let current = header;

  for (const block of blocks) {
    const next = `${current}\n\n${block}`;
    if (next.length <= LINE_TEXT_LIMIT) {
      current = next;
      continue;
    }
    messages.push(current);
    current = `${header}\n\n${block}`;
  }

  messages.push(current);
  return messages;
}

export function buildAdminInterviewEditUrl(
  adminBaseUrl: string,
  applicationId: string,
): string {
  const base = adminBaseUrl.replace(/\/+$/, '');
  return `${base}/teachers/${applicationId}/edit#interview`;
}

export function buildOperatorStudentApplicationMessage(
  name: string,
  email: string,
  phoneNumber: string,
): string {
  return `【新規生徒応募】\n氏名: ${name}\nメール: ${email}\n電話: ${phoneNumber}`;
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
