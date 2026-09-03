/** 旧 GAS「メール本文」シートに対応するメールテンプレート */

export const MAIL_SUBJECTS = {
  teacherHired: '【採用のお知らせ】',
  teacherRejected: '【選考結果のお知らせ】',
  teacherInterview: '【面接のご案内】',
  teacherMeetingUrl: '【面接URLのご案内】',
  teacherApplicationConfirmation: '【応募受付完了】',
  studentApplicationConfirmation: '【応募受付完了】',
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

export function buildTeacherMeetingUrlMailBody(
  email: string,
  meetingUrl: string,
): string {
  return `${email} 様\n\n面接の参加用URLをお送りします。\n当日は以下のURLからご参加ください。\n\n${meetingUrl}`;
}

/** 確認メールに載せる LINE 登録 URL。PUBLIC_SITE_URL 未設定・不正時は undefined */
export function buildTeacherLineLinkUrl(
  email: string,
  publicSiteUrl: string | undefined = process.env.PUBLIC_SITE_URL,
  applicationId?: string,
): string | undefined {
  const base = publicSiteUrl?.trim();
  if (!base) {
    return undefined;
  }

  try {
    const url = new URL('/line-link', base.endsWith('/') ? base : `${base}/`);
    url.searchParams.set('email', email);
    if (applicationId) {
      url.searchParams.set('applicationId', applicationId);
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

export function buildTeacherApplicationConfirmationBody(
  email: string,
  lineLinkUrl?: string,
): string {
  const lines = [
    `${email} 様`,
    '',
    'ご応募ありがとうございます。応募を受け付けました。',
  ];

  if (lineLinkUrl) {
    lines.push(
      '',
      '選考のご連絡を LINE で受け取るには、以下のリンクから登録を完了してください。',
      lineLinkUrl,
    );
  }

  return lines.join('\n');
}

export function buildStudentApplicationConfirmationBody(email: string): string {
  return `${email} 様\n\nご応募ありがとうございます。応募を受け付けました。`;
}

/** LINE 通知テンプレート */

export function buildOperatorTeacherApplicationMessage(
  nameKanji: string,
  email: string,
  resumeUrl: string | null,
): string {
  return `【新規先生応募】\n氏名: ${nameKanji}\nメール: ${email}\n履歴書: ${resumeUrl ?? 'フォーム入力（管理画面で確認）'}`;
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

/** 管理画面から面接URLを登録したときの応募者向けLINE通知 */
export function buildTeacherMeetingUrlLineMessage(
  guestName: string,
  meetingUrl: string,
): string {
  return `${guestName}さん\n面接の参加用URLをお送りします。\n当日は以下のURLからご参加ください。\n${meetingUrl}`;
}

export function buildOperatorInterviewScheduledMessage(
  guestName: string,
  meetingUrl: string,
): string {
  return `【面接予約完了】\n${guestName}さんとの面接が予約されました。\n参加URL: ${meetingUrl}`;
}

/** 管理画面から面接URLを登録したときの運営向けLINE通知 */
export function buildOperatorMeetingUrlRegisteredMessage(
  guestName: string,
  meetingUrl: string,
): string {
  return `【面接URL登録】\n${guestName}さんへ面接URLを登録・通知しました。\n参加URL: ${meetingUrl}`;
}
