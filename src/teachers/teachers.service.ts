import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TeacherApplicationStatus } from '@prisma/client';
import { LineService } from '../line/line.service';
import { MailService } from '../mail/mail.service';
import {
  buildOperatorMeetingUrlRegisteredMessage,
  buildOperatorTeacherApplicationMessage,
  buildTeacherHiredLineMessage,
  buildTeacherMeetingUrlLineMessage,
  buildTeacherRejectedLineMessage,
} from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherMeetingUrlDto } from './dto/update-teacher-meeting-url.dto';
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

    const response = toResponse(record);
    await this.notifyNewApplication(response).catch((err: unknown) => {
      this.logger.error('Failed to send new application notifications', err);
    });

    return response;
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

    const response = toResponse(updated);
    await this.notifyStatusChange(response).catch((err: unknown) => {
      this.logger.error('Failed to send status change notifications', err);
    });

    return response;
  }

  /** 面接用 Google Meet URL を登録し、メール/LINE通知を行う */
  async updateMeetingUrl(
    id: string,
    dto: UpdateTeacherMeetingUrlDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    const updated = await this.prisma.teacherApplication.update({
      where: { id },
      data: { meetingUrl: dto.meetingUrl },
      include: { resume: true },
    });

    const response = toResponse(updated);
    await this.notifyMeetingUrlRegistered(response).catch((err: unknown) => {
      this.logger.error('Failed to send meeting URL notifications', err);
    });

    return response;
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

  private async notifyMeetingUrlRegistered(
    record: TeacherApplicationResponseDto,
  ): Promise<void> {
    if (!record.meetingUrl) {
      return;
    }

    await this.mailService.sendTeacherMeetingUrlNotification(
      record.email,
      record.meetingUrl,
    );

    if (record.lineUserId) {
      await this.lineService.pushMessage(
        record.lineUserId,
        buildTeacherMeetingUrlLineMessage(record.nameKanji, record.meetingUrl),
      );
    }

    await this.lineService.pushMessageToGroup(
      buildOperatorMeetingUrlRegisteredMessage(
        record.nameKanji,
        record.meetingUrl,
      ),
    );
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

/** Json 列に保存された学歴/職歴/資格をレスポンス型へ変換する */
function toHistoryEntries(
  value: Prisma.JsonValue | null,
): TeacherResumeResponseDto['education'] {
  if (!Array.isArray(value)) {
    return null;
  }
  const entries = value.flatMap((entry) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      Array.isArray(entry) ||
      typeof entry.yearMonth !== 'string' ||
      typeof entry.description !== 'string'
    ) {
      return [];
    }
    return [{ yearMonth: entry.yearMonth, description: entry.description }];
  });
  return entries;
}

/** Prisma のレコードをレスポンス DTO へ変換する */
function toResponse(
  record: TeacherApplicationWithResume,
): TeacherApplicationResponseDto {
  const { resume, ...rest } = record;
  return {
    ...rest,
    resume: resume
      ? {
          photoUrl: resume.photoUrl,
          birthDate: resume.birthDate,
          gender: resume.gender,
          phoneNumber: resume.phoneNumber,
          postalCode: resume.postalCode,
          address: resume.address,
          nearestStation: resume.nearestStation,
          education: toHistoryEntries(resume.education),
          workHistory: toHistoryEntries(resume.workHistory),
          qualifications: toHistoryEntries(resume.qualifications),
          motivation: resume.motivation,
          selfPromotion: resume.selfPromotion,
          hobbies: resume.hobbies,
          requests: resume.requests,
        }
      : null,
  };
}
