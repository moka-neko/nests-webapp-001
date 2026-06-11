import { ApiProperty } from '@nestjs/swagger';
import { TeacherApplicationStatus } from '../enums/teacher-application-status.enum';

/** 先生の選考ステータス更新リクエスト（API #2: PATCH /api/v1/teachers/applications/{id}/status） */
export class UpdateTeacherStatusDto {
  @ApiProperty({
    description: '選考ステータス',
    enum: TeacherApplicationStatus,
    example: TeacherApplicationStatus.HIRED,
  })
  status: TeacherApplicationStatus;
}
