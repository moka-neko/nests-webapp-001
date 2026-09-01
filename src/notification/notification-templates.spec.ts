import {
  buildTeacherApplicationConfirmationBody,
  buildTeacherLineLinkUrl,
} from './notification-templates';

describe('buildTeacherLineLinkUrl', () => {
  it('公開サイトURLとメールから連携案内URLを組み立てる', () => {
    expect(
      buildTeacherLineLinkUrl('yamada@example.com', 'https://apply.example.com'),
    ).toBe(
      'https://apply.example.com/line-link?email=yamada%40example.com',
    );
  });

  it('末尾スラッシュを許容する', () => {
    expect(
      buildTeacherLineLinkUrl(
        'yamada@example.com',
        'https://apply.example.com/',
      ),
    ).toBe(
      'https://apply.example.com/line-link?email=yamada%40example.com',
    );
  });

  it('未設定時はundefined', () => {
    expect(buildTeacherLineLinkUrl('yamada@example.com', undefined)).toBeUndefined();
    expect(buildTeacherLineLinkUrl('yamada@example.com', '')).toBeUndefined();
    expect(buildTeacherLineLinkUrl('yamada@example.com', '  ')).toBeUndefined();
  });

  it('不正なURLはundefined', () => {
    expect(
      buildTeacherLineLinkUrl('yamada@example.com', 'not-a-url'),
    ).toBeUndefined();
  });
});

describe('buildTeacherApplicationConfirmationBody', () => {
  it('LINE登録URLがある場合は本文に含める', () => {
    const body = buildTeacherApplicationConfirmationBody(
      'yamada@example.com',
      'https://apply.example.com/line-link?email=yamada%40example.com',
    );

    expect(body).toContain('yamada@example.com 様');
    expect(body).toContain('ご応募ありがとうございます');
    expect(body).toContain(
      '選考のご連絡を LINE で受け取るには、以下のリンクから登録を完了してください。',
    );
    expect(body).toContain(
      'https://apply.example.com/line-link?email=yamada%40example.com',
    );
  });

  it('LINE登録URLがない場合はリンク案内を含めない', () => {
    const body = buildTeacherApplicationConfirmationBody('yamada@example.com');

    expect(body).toContain('ご応募ありがとうございます');
    expect(body).not.toContain('/line-link');
    expect(body).not.toContain('LINE');
  });
});
