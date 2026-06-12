import { Injectable, Logger } from '@nestjs/common';
import { LineService } from '../line/line.service';
import {
  buildInterviewMeetingLineMessage,
  buildOperatorInterviewScheduledMessage,
} from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { TimerexWebhookDto } from './dto/timerex-webhook.dto';
import { TimerexWebhookResponseDto } from './dto/timerex-webhook-response.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
  ) {}

  /** API #6: TimeRex予約通知を受け取り、meetingUrlを保存しLINE通知を行う */
  async receiveTimerex(
    timerexWebhookDto: TimerexWebhookDto,
  ): Promise<TimerexWebhookResponseDto> {
    const teacher = await this.prisma.teacherApplication.findFirst({
      where: { email: timerexWebhookDto.guestEmail },
    });

    if (teacher) {
      await this.prisma.teacherApplication.update({
        where: { id: teacher.id },
        data: { meetingUrl: timerexWebhookDto.meetingUrl },
      });

      if (teacher.lineUserId) {
        await this.lineService.pushMessage(
          teacher.lineUserId,
          buildInterviewMeetingLineMessage(
            timerexWebhookDto.guestName,
            timerexWebhookDto.meetingUrl,
          ),
        );
      }
    } else {
      this.logger.warn(
        `TimeRex webhook: teacher not found for email=${timerexWebhookDto.guestEmail}`,
      );
    }

    await this.lineService.pushMessageToGroup(
      buildOperatorInterviewScheduledMessage(
        timerexWebhookDto.guestName,
        timerexWebhookDto.meetingUrl,
      ),
    );

    return {
      message: '予約通知を受け付けました。',
      reservationId: timerexWebhookDto.reservationId,
    };
  }
}
