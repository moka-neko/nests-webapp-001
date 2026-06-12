import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TeacherApplicationStatus } from '@prisma/client';
import { LineService } from '../line/line.service';
import { MailService } from '../mail/mail.service';
import {
  buildOperatorTeacherApplicationMessage,
  buildTeacherHiredLineMessage,
  buildTeacherRejectedLineMessage,
} from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherStatusDto } from './dto/update-teacher-status.dto';
import { TeacherApplicationResponseDto } from './dto/teacher-application-response.dto';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly mailService: MailService,
  ) {}

  /** API #1: 先生の新規応募を受け付け、DBへ保存し通知を行う */
  async create(
    dto: CreateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    const record = await this.prisma.teacherApplication.create({ data: dto });

    await this.notifyNewApplication(record).catch((err: unknown) => {
      this.logger.error('Failed to send new application notifications', err);
    });

    return record;
  }

  /** API #7: 先生の応募データ一覧を取得する */
  async findAll(): Promise<TeacherApplicationResponseDto[]> {
    return this.prisma.teacherApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
  }

  /** API #2: 先生の選考ステータスを更新し、メール/LINE通知を行う */
  async updateStatus(
    id: string,
    dto: UpdateTeacherStatusDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    const updated = await this.prisma.teacherApplication.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.notifyStatusChange(updated).catch((err: unknown) => {
      this.logger.error('Failed to send status change notifications', err);
    });

    return updated;
  }

  /** API #8: 先生の基本情報を更新する */
  async update(
    id: string,
    dto: UpdateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    return this.prisma.teacherApplication.update({
      where: { id },
      data: dto,
    });
  }

  /** API #9: 指定した先生の応募データを削除する */
  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.teacherApplication.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const record = await this.prisma.teacherApplication.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`TeacherApplication id=${id} not found`);
    }
    return record;
  }

  private async notifyNewApplication(
    record: TeacherApplicationResponseDto,
  ): Promise<void> {
    const groupMessage = buildOperatorTeacherApplicationMessage(
      record.nameKanji,
      record.email,
      record.resumeUrl,
    );
    await this.lineService.pushMessageToGroup(groupMessage);
    await this.mailService.sendTeacherApplicationConfirmation(record.email);
  }

  private async notifyStatusChange(
    record: TeacherApplicationResponseDto,
  ): Promise<void> {
    switch (record.status) {
      case TeacherApplicationStatus.INTERVIEW:
        await this.mailService.sendTeacherInterviewNotification(record.email);
        break;
      case TeacherApplicationStatus.HIRED:
        await this.mailService.sendTeacherHiredNotification(record.email);
        if (record.lineUserId) {
          await this.lineService.pushMessage(
            record.lineUserId,
            buildTeacherHiredLineMessage(),
          );
        }
        break;
      case TeacherApplicationStatus.REJECTED:
        await this.mailService.sendTeacherRejectedNotification(record.email);
        if (record.lineUserId) {
          await this.lineService.pushMessage(
            record.lineUserId,
            buildTeacherRejectedLineMessage(),
          );
        }
        break;
      default:
        break;
    }
  }
}
