import { ApiProperty } from '@nestjs/swagger';

export class InterviewCandidateDateOptionDto {
  @ApiProperty({ description: '日付（YYYY-MM-DD）', example: '2026-10-19' })
  date: string;

  @ApiProperty({ description: '表示ラベル', example: '10/19（月）' })
  label: string;
}

export class InterviewCandidateWindowDto {
  @ApiProperty({
    description: '選択できる最初の日（月曜日）',
    example: '2026-10-19',
  })
  startDate: string;

  @ApiProperty({
    description: '選択できる最後の日（日曜日）',
    example: '2026-10-25',
  })
  endDate: string;

  @ApiProperty({ type: [InterviewCandidateDateOptionDto] })
  dates: InterviewCandidateDateOptionDto[];
}
