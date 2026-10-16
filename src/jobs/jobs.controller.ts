import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { WeeklyInterviewReminderResponseDto } from './dto/weekly-interview-reminder-response.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiSecurity('CronSecret')
@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * 毎週月曜に運営グループへ、今週の面接日程の編集依頼を送る。
   * API プロセス単体では曜日起動できないため、EventBridge Scheduler などから呼ぶ。
   */
  @Public()
  @UseGuards(CronSecretGuard)
  @Post('weekly-interview-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '今週の面接日程編集リマインド',
    description:
      '日本時間の今週（月曜〜日曜）に面接候補日がある未確定応募（未選考・面接実施）について、運営グループLINEへ「今週の面接日程を日曜日までに編集をお願いいたします。」と、応募者ごとの氏名・面接編集画面URLを通知する。対象がいない週は送信しない。同じ週の再送は force=true のときのみ。推奨起動は Amazon EventBridge Scheduler（毎週月曜 09:00 Asia/Tokyo）からこのエンドポイントを呼ぶ方法。',
  })
  @ApiResponse({
    status: 200,
    description: '処理結果',
    type: WeeklyInterviewReminderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Cronシークレットが無効' })
  sendWeeklyInterviewReminder(
    @Query('force') force?: string,
  ): Promise<WeeklyInterviewReminderResponseDto> {
    return this.jobsService.sendWeeklyInterviewReminder({
      force: force === 'true',
    });
  }
}
