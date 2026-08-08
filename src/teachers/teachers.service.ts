import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TeacherApplicationStatus } from '@prisma/client';
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
import {
  TeacherResumeInputDto,
  TeacherResumeResponseDto,
} from './dto/teacher-resume.dto';

type TeacherApplicationWithResume = Prisma.TeacherApplicationGetPayload<{
  include: { resume: true };
}>;

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
    const { resume, ...data } = dto;
    const record = await this.prisma.teacherApplication.create({
      data: {
        ...data,
        resume: resume ? { create: toResumeData(resume) } : undefined,
      },
      include: { resume: true },
    });

    await this.notifyNewApplication(record).catch((err: unknown) => {
      this.logger.error('Failed to send new application notifications', err);
    });

    return toResponse(record);
  }

  /** API #7: 先生の応募データ一覧を取得する */
  async findAll(): Promise<TeacherApplicationResponseDto[]> {
    const records = await this.prisma.teacherApplication.findMany({
      orderBy: { submittedAt: 'desc' },
      include: { resume: true },
    });
    return records.map(toResponse);
  }

  /** 先生の応募データを ID で取得する */
  async findOne(id: string): Promise<TeacherApplicationResponseDto> {
    return toResponse(await this.findOneOrFail(id));
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
      include: { resume: true },
    });

    await this.notifyStatusChange(updated).catch((err: unknown) => {
      this.logger.error('Failed to send status change notifications', err);
    });

    return toResponse(updated);
  }

  /** API #8: 先生の基本情報を更新する */
  async update(
    id: string,
    dto: UpdateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    const { resume, ...data } = dto;
    const resumeData = resume ? toResumeData(resume) : undefined;
    const updated = await this.prisma.teacherApplication.update({
      where: { id },
      data: {
        ...data,
        resume: resumeData
          ? { upsert: { create: resumeData, update: resumeData } }
          : undefined,
      },
      include: { resume: true },
    });
    return toResponse(updated);
  }

  /** API #9: 指定した先生の応募データを削除する */
  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.teacherApplication.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const record = await this.prisma.teacherApplication.findUnique({
      where: { id },
      include: { resume: true },
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

/** 履歴書入力 DTO を Prisma の作成/更新データへ変換する */
function toResumeData(
  resume: TeacherResumeInputDto,
): Omit<Prisma.TeacherResumeCreateInput, 'application'> {
  const toEntries = (
    entries?: { yearMonth: string; description: string }[],
  ): Prisma.InputJsonValue | typeof Prisma.DbNull =>
    entries?.map((e) => ({
      yearMonth: e.yearMonth,
      description: e.description,
    })) ?? Prisma.DbNull;

  return {
    photoUrl: resume.photoUrl ?? null,
    birthDate: resume.birthDate ?? null,
    gender: resume.gender ?? null,
    phoneNumber: resume.phoneNumber ?? null,
    postalCode: resume.postalCode ?? null,
    address: resume.address ?? null,
    nearestStation: resume.nearestStation ?? null,
    education: toEntries(resume.education),
    workHistory: toEntries(resume.workHistory),
    qualifications: toEntries(resume.qualifications),
    motivation: resume.motivation ?? null,
    selfPromotion: resume.selfPromotion ?? null,
    hobbies: resume.hobbies ?? null,
    requests: resume.requests ?? null,
  };
}

/** Prisma のレコードをレスポンス DTO へ変換する */
function toResponse(
  record: TeacherApplicationWithResume,
): TeacherApplicationResponseDto {
  const { resume, ...rest } = record;
  return {
    ...rest,
    resume: resume
      ? ({
          photoUrl: resume.photoUrl,
          birthDate: resume.birthDate,
          gender: resume.gender,
          phoneNumber: resume.phoneNumber,
          postalCode: resume.postalCode,
          address: resume.address,
          nearestStation: resume.nearestStation,
          education: resume.education,
          workHistory: resume.workHistory,
          qualifications: resume.qualifications,
          motivation: resume.motivation,
          selfPromotion: resume.selfPromotion,
          hobbies: resume.hobbies,
          requests: resume.requests,
        } as TeacherResumeResponseDto)
      : null,
  };
}
