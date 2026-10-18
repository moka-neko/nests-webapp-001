import {
  getInterviewCandidateWindow,
  getTokyoWeekDates,
  normalizeInterviewCandidateDates,
} from './interview-calendar';

describe('interview candidate window', () => {
  it('2026-10-04 の入力では 10/19〜10/25 を返す', () => {
    const window = getInterviewCandidateWindow(
      new Date('2026-10-04T03:00:00.000Z'),
    );

    expect(window.startDate).toBe('2026-10-19');
    expect(window.endDate).toBe('2026-10-25');
    expect(window.dates.map((option) => option.date)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
    expect(window.dates[0].label).toBe('10/19（月）');
    expect(window.dates[6].label).toBe('10/25（日）');
  });

  it('14日後が月曜ならその週を返す', () => {
    const window = getInterviewCandidateWindow(
      new Date('2026-10-05T03:00:00.000Z'),
    );

    expect(window.startDate).toBe('2026-10-19');
    expect(window.endDate).toBe('2026-10-25');
  });

  it('14日後が火曜なら次の月曜から1週間を返す', () => {
    const window = getInterviewCandidateWindow(
      new Date('2026-10-06T03:00:00.000Z'),
    );

    expect(window.startDate).toBe('2026-10-26');
    expect(window.endDate).toBe('2026-11-01');
  });

  it('日本時間の日付境界で週が切り替わる', () => {
    const beforeMidnight = getInterviewCandidateWindow(
      new Date('2026-10-05T14:59:00.000Z'),
    );
    const afterMidnight = getInterviewCandidateWindow(
      new Date('2026-10-05T15:00:00.000Z'),
    );

    expect(beforeMidnight.startDate).toBe('2026-10-19');
    expect(afterMidnight.startDate).toBe('2026-10-26');
  });

  it('期間外の候補日を拒否する', () => {
    const now = new Date('2026-10-04T03:00:00.000Z');
    const result = normalizeInterviewCandidateDates(
      ['2026-10-19', '2026-10-12'],
      now,
    );

    expect(result).toEqual({
      error:
        '面接候補日は 10/19（月） から 10/25（日） の期間で選択してください',
    });
  });

  it('期間内の候補日は重複を除いて日付順にする', () => {
    const result = normalizeInterviewCandidateDates(
      ['2026-10-21', '2026-10-19', '2026-10-21'],
      new Date('2026-10-04T03:00:00.000Z'),
    );

    expect(result).toEqual({ dates: ['2026-10-19', '2026-10-21'] });
  });
});

describe('tokyo week', () => {
  it('月曜通知日の今週は月曜から日曜', () => {
    expect(getTokyoWeekDates(new Date('2026-10-19T00:00:00.000Z'))).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
  });

  it('日曜も同じ週に含める', () => {
    expect(getTokyoWeekDates(new Date('2026-10-25T14:00:00.000Z'))[0]).toBe(
      '2026-10-19',
    );
  });
});
