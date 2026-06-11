import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentApplicationDto } from './dto/create-student.dto';
import { UpdateStudentApplicationDto } from './dto/update-student.dto';
import { StudentApplicationResponseDto } from './dto/student-application-response.dto';

@ApiTags('students')
@Controller('api/v1/students/applications')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * API #3: POST /api/v1/students/applications
   * 生徒の新規応募を受け付け、データベースへ保存。
   * 運営グループへの通知等を行う。
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '生徒の新規応募',
    description:
      '生徒の新規応募を受け付け、データベースへ保存する。運営グループへの通知等を行う。',
  })
  @ApiResponse({
    status: 201,
    description: '応募の受け付けに成功',
    type: StudentApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'リクエストパラメータが不正' })
  async create(
    @Body() createStudentApplicationDto: CreateStudentApplicationDto,
  ): Promise<StudentApplicationResponseDto> {
    return this.studentsService.create(createStudentApplicationDto);
  }

  /**
   * API #10: GET /api/v1/students/applications
   * 生徒の応募データ一覧を取得する。
   */
  @Get()
  @ApiOperation({
    summary: '生徒の応募データ一覧取得',
    description: '生徒の応募データ一覧を取得する。',
  })
  @ApiResponse({
    status: 200,
    description: '一覧取得に成功',
    type: [StudentApplicationResponseDto],
  })
  async findAll(): Promise<StudentApplicationResponseDto[]> {
    return this.studentsService.findAll();
  }

  /**
   * API #11: PUT /api/v1/students/applications/{id}
   * 生徒の基本情報（名前、電話番号、国籍など）を修正する。
   */
  @Put(':id')
  @ApiOperation({
    summary: '生徒の基本情報更新',
    description: '生徒の基本情報（名前、電話番号、国籍など）を修正する。',
  })
  @ApiParam({
    name: 'id',
    description: '生徒応募ID（UUID）',
    example: 'b2c3d4e5-...',
  })
  @ApiResponse({
    status: 200,
    description: '更新に成功',
    type: StudentApplicationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async update(
    @Param('id') id: string,
    @Body() updateStudentApplicationDto: UpdateStudentApplicationDto,
  ): Promise<StudentApplicationResponseDto> {
    return this.studentsService.update(id, updateStudentApplicationDto);
  }

  /**
   * API #12: DELETE /api/v1/students/applications/{id}
   * 指定した生徒の応募データを削除する。
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '生徒の応募データ削除',
    description: '指定した生徒の応募データを削除する。',
  })
  @ApiParam({
    name: 'id',
    description: '生徒応募ID（UUID）',
    example: 'b2c3d4e5-...',
  })
  @ApiResponse({ status: 204, description: '削除に成功' })
  @ApiResponse({
    status: 404,
    description: '指定したIDの応募データが存在しない',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentsService.remove(id);
  }
}
