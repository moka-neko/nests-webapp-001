import { ApiProperty } from '@nestjs/swagger';

/** TimeRex Webhook受け取り確認レスポンス */
export class TimerexWebhookResponseDto {
  @ApiProperty({
    description: '処理結果メッセージ',
    example: '予約通知を受け付けました。',
  })
  message: string;

  @ApiProperty({
    description: '受け取った予約ID',
    example: 'trx-reservation-00123',
  })
  reservationId: string;
}
