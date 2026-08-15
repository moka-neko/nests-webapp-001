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
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { TeachersService } from './teachers.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherMeetingUrlDto } from './dto/update-teacher-meeting-url.dto';
import { UpdateTeacherStatusDto } from './dto/update-teacher-status.dto';
import { TeacherApplicationResponseDto } from './dto/teacher-application-response.dto';
import { UploadTeacherPhotoResponseDto } from './dto/upload-teacher-photo-response.dto';

/** 顔写真の最大サイズ（5MB） */
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('teachers')
@ApiBearerAuth('bearer')
@Controller('api/v1/teachers/applications')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  /**
   * POST /api/v1/teachers/applications/photo
   * 履歴書用の顔写真を Supabase Storage にアップロードし、公開URLを返す。
   * 返却された photoUrl を応募リクエストの resume.photoUrl に設定して使用する。
   */
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('ApiKey', ['x-api-key'])
  @Post('photo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '履歴書用の顔写真アップロード',
    description:
      '顔写真（JPEG/PNG/WebP、5MBまで）を Supabase Storage にアップロードし、公開URLを返す。返却された photoUrl を応募リクエストの resume.photoUrl に設定する。',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: '顔写真ファイル（JPEG/PNG/WebP、5MBまで）',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'アップロードに成功',
    type: UploadTeacherPhotoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'ファイル形式またはサイズが不正' })
  @ApiResponse({
    status: 503,
    description: 'ストレージ未設定またはアップロード失敗',
  })
  async uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PHOTO_SIZE_BYTES }),
          // file-type パッケージ（ESM）による magic number 検証は Jest 環境で
          // 動作しないため、MIME タイプ文字列の検証のみ行う
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ): Promise<UploadTeacherPhotoResponseDto> {
    const photoUrl = await this.storageService.uploadTeacherPhoto(photo);
    return { photoUrl };
  }

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
   * PATCH /api/v1/teachers/applications/{id}/meeting-url
   * 面接用 Google Meet URL を登録し、応募者へメールおよび LINE 通知を行う。
   */
  @Patch(':id/meeting-url')
  @ApiOperation({
    summary: '面接用 Google Meet URL の登録',
    description:
      '面接用 Google Meet URL を登録し、応募者へメールおよび LINE（連携済みの場合）で通知する。運営グループへも LINE 通知する。',
  })
  @ApiParam({
    name: 'id',
    description: '先生応募ID（UUID）',
    example: 'a1b2c3d4-...',
  })
  @ApiResponse({
    status: 200,
    description: '面接URLの登録に成功',
    type: TeacherApplicationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストパラメータが不正',
  })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async updateMeetingUrl(
    @Param('id') id: string,
    @Body() updateTeacherMeetingUrlDto: UpdateTeacherMeetingUrlDto,
  ): Promise<TeacherApplicationResponseDto> {
    return this.teachersService.updateMeetingUrl(id, updateTeacherMeetingUrlDto);
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
