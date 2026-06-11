import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherStatusDto } from './dto/update-teacher-status.dto';
import { TeacherApplicationResponseDto } from './dto/teacher-application-response.dto';

@ApiTags('teachers')
@Controller('api/v1/teachers/applications')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  /**
   * API #1: POST /api/v1/teachers/applications
   * 先生の新規応募を受け付け、データベースへ保存。
   * 運営グループへのLINE通知と、応募者への確認メール送信を行う。
   */
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
