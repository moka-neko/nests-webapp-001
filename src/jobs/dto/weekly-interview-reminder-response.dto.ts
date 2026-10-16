import { ApiProperty } from '@nestjs/swagger';

export class WeeklyInterviewReminderResponseDto {
  @ApiProperty({ description: '運営グループへ通知したか' })
  notified: boolean;

  @ApiProperty({ description: '同じ週の通知を既に送っているか' })
  alreadySent: boolean;

  @ApiProperty({ description: '通知対象の応募者数' })
  applicantCount: number;

  @ApiProperty({ description: '送信したLINEメッセージ数' })
  messageCount: number;

  @ApiProperty({ description: '対象週の月曜日（YYYY-MM-DD、日本時間）' })
  weekStart: string;

  @ApiProperty({ description: '対象週の日曜日（YYYY-MM-DD、日本時間）' })
  weekEnd: string;
}
