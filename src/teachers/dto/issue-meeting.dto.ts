import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

/**
 * 面接 URL の発行と通知（POST /api/v1/teachers/applications/{id}/meeting）
 *
 * meetingUrl を省略すると Google カレンダーに予定を作り Google Meet の URL を発行する。
 * 指定した場合はその URL を登録して通知する（Google 連携が未設定の場合の手動登録用）。
 */
export class IssueMeetingDto {
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description:
      '手動で登録する面接URL。省略時は Google Meet の URL を自動発行する',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  meetingUrl?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: '応募者（メール・LINE）と運営グループLINEへ通知するか',
    default: true,
  })
  notify?: boolean;
}
