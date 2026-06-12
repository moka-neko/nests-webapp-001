import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { TimerexWebhookGuard } from '../common/guards/timerex-webhook.guard';
import { WebhooksService } from './webhooks.service';
import { TimerexWebhookDto } from './dto/timerex-webhook.dto';
import { TimerexWebhookResponseDto } from './dto/timerex-webhook-response.dto';

@ApiTags('webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * API #6: POST /api/v1/webhooks/timerex
   * TimeRexからの面接予約完了通知を受け取る。
   * Google Meet等のURLを記録し、対象ユーザーへのLINE個別通知と
   * 運営グループへの予約完了通知を行う。
   */
  @Public()
  @UseGuards(TimerexWebhookGuard)
  @ApiSecurity('WebhookSecret', ['x-webhook-secret'])
  @Post('timerex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'TimeRex面接予約完了通知',
    description:
      'TimeRexからの面接予約完了通知を受け取る。データ内のGoogle Meet等のURLを記録し、対象ユーザーへの個別LINE通知と運営グループへの予約完了通知を行う。',
  })
  @ApiResponse({
    status: 200,
    description: '通知の受け取りに成功',
    type: TimerexWebhookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'リクエストペイロードが不正' })
  async receiveTimerex(
    @Body() timerexWebhookDto: TimerexWebhookDto,
  ): Promise<TimerexWebhookResponseDto> {
    return this.webhooksService.receiveTimerex(timerexWebhookDto);
  }
}
