import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { TeachersService } from './teachers.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherStatusDto } from './dto/update-teacher-status.dto';
import { TeacherApplicationResponseDto } from './dto/teacher-application-response.dto';
import { InterviewCandidateWindowDto } from './dto/interview-candidate-window.dto';
import { IssueMeetingDto } from './dto/issue-meeting.dto';
import { WeeklyInterviewsResponseDto } from './dto/weekly-interviews-response.dto';

@ApiTags('teachers')
@ApiBearerAuth('bearer')
@Controller('api/v1/teachers/applications')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  /**
   * API #1: POST /api/v1/teachers/applications
   * 先生の新規応募を受け付け、データベースへ保存。
   * 運営グループへのLINE通知と、応募者への確認メール送信を行う。
   */
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('ApiKey', ['x-api-key'])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '先生の新規応募',
    description:
      '先生の新規応募を受け付け、データベースへ保存する。運営グループへのLINE通知と、応募者への確認メール送信を行う。',
  })
  @ApiResponse({
    status: 201,
    description: '応募の受け付けに成功',
    type: TeacherApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'リクエストパラメータが不正' })
  async create(
    @Body() createTeacherApplicationDto: CreateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    return this.teachersService.create(createTeacherApplicationDto);
  }

  /**
   * API #7: GET /api/v1/teachers/applications
   * 先生の応募データ一覧を取得する。
   */
  @Get()
  @ApiOperation({
    summary: '先生の応募データ一覧取得',
    description: '先生の応募データ一覧を取得する。',
  })
  @ApiResponse({
    status: 200,
    description: '一覧取得に成功',
    type: [TeacherApplicationResponseDto],
  })
  async findAll(): Promise<TeacherApplicationResponseDto[]> {
    return this.teachersService.findAll();
  }

  /**
   * GET /api/v1/teachers/applications/interview-candidate-dates
   * 応募フォームに表示する面接候補日（任意・1週間）を返す。
   */
  @Public()
  @Get('interview-candidate-dates')
  @ApiOperation({
    summary: '面接候補日の選択期間',
    description:
      '先生応募フォームで選択できる面接候補日を返す。任意入力。入力日（日本時間）の14日後以降で最初の月曜日から日曜までの7日間。例: 2026-10-04 の入力では 2026-10-19〜2026-10-25。',
  })
  @ApiResponse({
    status: 200,
    description: '選択期間の取得に成功',
    type: InterviewCandidateWindowDto,
  })
  getInterviewCandidateWindow(): InterviewCandidateWindowDto {
    return this.teachersService.getInterviewCandidateWindow();
  }

  /**
   * GET /api/v1/teachers/applications/weekly-interviews?week=YYYY-MM-DD
   * 面接日程調整ページ（毎週月曜の通知URLの遷移先）用の応募者一覧。
   */
  @Get('weekly-interviews')
  @ApiOperation({
    summary: '週ごとの面接日程調整対象の一覧',
    description:
      '指定日（省略時は今日・日本時間）を含む週（月曜〜日曜）に面接候補日がある、選考中（未選考・面接実施）の応募者を候補日の早い順に返す。',
  })
  @ApiQuery({
    name: 'week',
    required: false,
    description: '対象週に含まれる日付（YYYY-MM-DD）',
    example: '2026-10-19',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: WeeklyInterviewsResponseDto,
  })
  async findWeeklyInterviews(
    @Query('week') week?: string,
  ): Promise<WeeklyInterviewsResponseDto> {
    return this.teachersService.findWeeklyInterviews(week);
  }

  /**
   * GET /api/v1/teachers/applications/{id}
   * 先生の応募データを ID で取得する。
   */
  @Get(':id')
  @ApiOperation({
    summary: '先生の応募データ取得',
    description: '指定した ID の先生応募データを取得する。',
  })
  @ApiParam({
    name: 'id',
    description: '先生応募ID（UUID）',
    example: 'a1b2c3d4-...',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: TeacherApplicationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<TeacherApplicationResponseDto> {
    return this.teachersService.findOne(id);
  }

  /**
   * POST /api/v1/teachers/applications/{id}/meeting
   * 確定面接日時で Google Meet の URL を発行（または手動登録）し、
   * 応募者（メール・LINE）と運営グループLINEへ通知する。
   */
  @Post(':id/meeting')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '面接URLの発行と通知',
    description:
      '確定面接日時をもとに Google カレンダーへ予定を作成して Google Meet の URL を発行し、応募者へメール（LINE連携済みならLINEも）、運営グループLINEへ通知する。発行済みの場合は同じ予定の日時を更新し、同じURLで再通知する。meetingUrl を指定すると、その URL を登録して通知する（Google 連携が未設定の場合）。',
  })
  @ApiParam({ name: 'id', description: '先生応募ID（UUID）' })
  @ApiResponse({
    status: 200,
    description: '発行・通知に成功',
    type: TeacherApplicationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      '確定面接日時が未設定、Google 連携が未設定で URL 未指定、または発行に失敗',
  })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async issueMeeting(
    @Param('id') id: string,
    @Body() dto: IssueMeetingDto,
  ): Promise<TeacherApplicationResponseDto> {
    return this.teachersService.issueMeeting(id, dto);
  }

  /**
   * API #2: PATCH /api/v1/teachers/applications/{id}/status
   * 先生の選考ステータス（採用・不採用・面接実施）を更新し、
   * 結果に応じたメール送信およびLINE個別通知を行う。
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: '先生の選考ステータス更新',
    description:
      '先生の選考ステータス（採用・不採用・面接実施）を更新し、結果に応じたメール送信およびLINE個別通知を行う。',
  })
  @ApiParam({
    name: 'id',
    description: '先生応募ID（UUID）',
    example: 'a1b2c3d4-...',
  })
  @ApiResponse({
    status: 200,
    description: 'ステータス更新に成功',
    type: TeacherApplicationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTeacherStatusDto: UpdateTeacherStatusDto,
  ): Promise<TeacherApplicationResponseDto> {
    return this.teachersService.updateStatus(id, updateTeacherStatusDto);
  }

  /**
   * API #8: PUT /api/v1/teachers/applications/{id}
   * 先生の基本情報（名前、年齢、勤務場所、履歴書URLなど）を修正する。
   */
  @Put(':id')
  @ApiOperation({
    summary: '先生の基本情報更新',
    description:
      '先生の基本情報（名前、年齢、勤務場所、履歴書URLなど）を修正する。',
  })
  @ApiParam({
    name: 'id',
    description: '先生応募ID（UUID）',
    example: 'a1b2c3d4-...',
  })
  @ApiResponse({
    status: 200,
    description: '更新に成功',
    type: TeacherApplicationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTeacherApplicationDto: UpdateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    return this.teachersService.update(id, updateTeacherApplicationDto);
  }

  /**
   * API #9: DELETE /api/v1/teachers/applications/{id}
   * 指定した先生の応募データを削除する。
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '先生の応募データ削除',
    description: '指定した先生の応募データを削除する。',
  })
  @ApiParam({
    name: 'id',
    description: '先生応募ID（UUID）',
    example: 'a1b2c3d4-...',
  })
  @ApiResponse({ status: 204, description: '削除に成功' })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.teachersService.remove(id);
  }
}
