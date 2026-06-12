import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LineService } from '../line/line.service';
import { buildOperatorStudentApplicationMessage } from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentApplicationDto } from './dto/create-student.dto';
import { UpdateStudentApplicationDto } from './dto/update-student.dto';
import { StudentApplicationResponseDto } from './dto/student-application-response.dto';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
  ) {}

  /** API #3: 生徒の新規応募を受け付け、DBへ保存し運営へ通知する */
  async create(
    dto: CreateStudentApplicationDto,
  ): Promise<StudentApplicationResponseDto> {
    const record = await this.prisma.studentApplication.create({ data: dto });

    await this.notifyNewApplication(record).catch((err: unknown) => {
      this.logger.error('Failed to send new student application notification', err);
    });

    return record;
  }

  /** API #10: 生徒の応募データ一覧を取得する */
  async findAll(): Promise<StudentApplicationResponseDto[]> {
    return this.prisma.studentApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
  }

  /** API #11: 生徒の基本情報を更新する */
  async update(
    id: string,
    dto: UpdateStudentApplicationDto,
  ): Promise<StudentApplicationResponseDto> {
    await this.findOneOrFail(id);
    return this.prisma.studentApplication.update({
      where: { id },
      data: dto,
    });
  }

  /** API #12: 指定した生徒の応募データを削除する */
  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.studentApplication.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const record = await this.prisma.studentApplication.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`StudentApplication id=${id} not found`);
    }
    return record;
  }

  private async notifyNewApplication(
    record: StudentApplicationResponseDto,
  ): Promise<void> {
    const message = buildOperatorStudentApplicationMessage(
      record.name,
      record.email,
      record.phoneNumber,
    );
    await this.lineService.pushMessageToGroup(message);
  }
}
