import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** TimeRexからの面接予約完了通知ペイロード（API #6: POST /api/v1/webhooks/timerex） */
export class TimerexWebhookDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'TimeRexの予約ID',
    example: 'trx-reservation-00123',
  })
  reservationId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '予約されたカレンダー（イベント）名',
    example: '先生面接（山田 太郎）',
  })
  calendarTitle: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '面接開始日時（ISO8601形式）',
    example: '2026-06-10T14:00:00+09:00',
  })
  scheduledStartAt: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '面接終了日時（ISO8601形式）',
    example: '2026-06-10T14:30:00+09:00',
  })
  scheduledEndAt: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Google Meetなどのオンライン面接URL',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  meetingUrl: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '予約者（先生候補）の氏名',
    example: '山田 太郎',
  })
  guestName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '予約者のメールアドレス',
    example: 'yamada@example.com',
  })
  guestEmail: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '予約時の備考',
    example: 'よろしくお願いします。',
  })
  notes?: string;
}
