import { ApiProperty } from '@nestjs/swagger';
import { TeacherApplicationResponseDto } from './teacher-application-response.dto';

export class WeeklyInterviewApplicationDto extends TeacherApplicationResponseDto {
  @ApiProperty({
    description: '対象週の中で最も早い面接候補日（YYYY-MM-DD）',
    example: '2026-10-19',
  })
  earliestCandidateDate: string;
}

export class WeeklyInterviewsResponseDto {
  @ApiProperty({ description: '対象週の月曜日（YYYY-MM-DD）' })
  weekStart: string;

  @ApiProperty({ description: '対象週の日曜日（YYYY-MM-DD）' })
  weekEnd: string;

  @ApiProperty({
    description: '対象週に面接候補日がある選考中（未選考・面接実施）の応募者',
    type: [WeeklyInterviewApplicationDto],
  })
  applications: WeeklyInterviewApplicationDto[];
}
