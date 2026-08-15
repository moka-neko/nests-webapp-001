import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, MaxLength } from 'class-validator';

/** 先生の面接用 Google Meet URL 登録リクエスト（PATCH /api/v1/teachers/applications/{id}/meeting-url） */
export class UpdateTeacherMeetingUrlDto {
  @IsUrl({ require_protocol: true }, { message: 'meetingUrl must be a valid URL' })
  @MaxLength(2000)
  @ApiProperty({
    description: '面接用 Google Meet URL',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  meetingUrl: string;
}
