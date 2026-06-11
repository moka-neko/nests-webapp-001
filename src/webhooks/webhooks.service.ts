import { Injectable } from '@nestjs/common';
import { TimerexWebhookDto } from './dto/timerex-webhook.dto';
import { TimerexWebhookResponseDto } from './dto/timerex-webhook-response.dto';

@Injectable()
export class WebhooksService {
  /**
   * API #6: TimeRex予約通知を受け取り、meetingURLを保存、LINE通知を行う（仮実装）
   * 実装時はPrismaでmeetingUrlをDBに保存し、LINE Messaging APIで通知を送る。
   */
  receiveTimerex(
    timerexWebhookDto: TimerexWebhookDto,
  ): TimerexWebhookResponseDto {
    return {
      message: '予約通知を受け付けました。',
      reservationId: timerexWebhookDto.reservationId,
    };
  }
}
