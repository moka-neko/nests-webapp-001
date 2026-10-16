import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTeacherApplicationDto } from './update-teacher.dto';

describe('UpdateTeacherApplicationDto', () => {
  const base = {
    nameKanji: '山田 太郎',
    nameKatakana: 'ヤマダ タロウ',
    age: 25,
    workLocation: '東京都',
    resumeUrl: 'https://drive.google.com/file/d/abc',
  };

  it('確定面接日時の null を受け付ける', async () => {
    const dto = plainToInstance(UpdateTeacherApplicationDto, {
      ...base,
      interviewCandidateDates: [],
      interviewScheduledAt: null,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.interviewScheduledAt).toBeNull();
  });

  it('不正な面接候補日を拒否する', async () => {
    const dto = plainToInstance(UpdateTeacherApplicationDto, {
      ...base,
      interviewCandidateDates: ['2026/10/19'],
    });
    const errors = await validate(dto);
    expect(
      errors.some((error) => error.property === 'interviewCandidateDates'),
    ).toBe(true);
  });
});
