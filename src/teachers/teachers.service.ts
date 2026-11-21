import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TeacherApplicationStatus } from '@prisma/client';
import { GoogleMeetService } from '../google/google-meet.service';
import { LineService } from '../line/line.service';
import { MailService } from '../mail/mail.service';
import {
  buildInterviewInvitationLineMessage,
  buildOperatorInterviewInvitationMessage,
  buildOperatorTeacherApplicationMessage,
  buildTeacherHiredLineMessage,
  buildTeacherRejectedLineMessage,
} from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { InterviewCandidateWindowDto } from './dto/interview-candidate-window.dto';
import { IssueMeetingDto } from './dto/issue-meeting.dto';
import { WeeklyInterviewsResponseDto } from './dto/weekly-interviews-response.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherStatusDto } from './dto/update-teacher-status.dto';
import { TeacherApplicationResponseDto } from './dto/teacher-application-response.dto';
import {
  getInterviewCandidateWindow as buildInterviewCandidateWindow,
  getTokyoWeekDates,
  isValidYmd,
  normalizeEditableCandidateDates,
  normalizeInterviewCandidateDates,
} from './interview-calendar';
import { findWeeklyInterviewApplications } from './weekly-interviews';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly mailService: MailService,
    private readonly googleMeetService: GoogleMeetService,
  ) {}

  /** 応募フォームに表示する面接候補日（任意・1週間） */
  getInterviewCandidateWindow(
    now: Date = new Date(),
  ): InterviewCandidateWindowDto {
    return buildInterviewCandidateWindow(now);
  }

  /** API #1: 先生の新規応募を受け付け、DBへ保存し通知を行う */
  async create(
    dto: CreateTeacherApplicationDto,
    now: Date = new Date(),
  ): Promise<TeacherApplicationResponseDto> {
    const interviewCandidateDates = this.resolveCandidateDates(
      dto.interviewCandidateDates ?? [],
      now,
    );
    const record = await this.prisma.teacherApplication.create({
      data: {
        ...dto,
        interviewCandidateDates,
      },
    });

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

  /** 先生の応募データを ID で取得する */
  async findOne(id: string): Promise<TeacherApplicationResponseDto> {
    return this.findOneOrFail(id);
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

  /** API #8: 先生の基本情報と面接日程を更新する */
  async update(
    id: string,
    dto: UpdateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    const { interviewCandidateDates, interviewScheduledAt, ...rest } = dto;
    return this.prisma.teacherApplication.update({
      where: { id },
      data: {
        ...rest,
        ...(interviewCandidateDates !== undefined
          ? {
              interviewCandidateDates: this.resolveEditableCandidateDates(
                interviewCandidateDates,
              ),
            }
          : {}),
        ...(interviewScheduledAt !== undefined
          ? {
              interviewScheduledAt: interviewScheduledAt
                ? new Date(interviewScheduledAt)
                : null,
            }
          : {}),
      },
    });
  }

  /**
   * 面接日程調整ページ用: 指定日（YYYY-MM-DD、省略時は今日）を含む週に
   * 面接候補日がある選考中の応募者一覧
   */
  async findWeeklyInterviews(
    week?: string,
    now: Date = new Date(),
  ): Promise<WeeklyInterviewsResponseDto> {
    if (week !== undefined && !isValidYmd(week)) {
      throw new BadRequestException(
        'week は YYYY-MM-DD 形式で指定してください',
      );
    }
    const base = week ? new Date(`${week}T12:00:00+09:00`) : now;
    const weekDates = getTokyoWeekDates(base);
    const applications = await findWeeklyInterviewApplications(
      this.prisma,
      weekDates,
    );
    return {
      weekStart: weekDates[0],
      weekEnd: weekDates[6],
      applications,
    };
  }

  /**
   * 面接URLを発行（Google Meet）または手動登録し、応募者と運営へ通知する。
   * 確定面接日時が保存されていることが前提。
   */
  async issueMeeting(
    id: string,
    dto: IssueMeetingDto,
  ): Promise<TeacherApplicationResponseDto> {
    const record = await this.findOneOrFail(id);
    if (!record.interviewScheduledAt) {
      throw new BadRequestException(
        '確定面接日時を保存してから面接URLを発行してください',
      );
    }

    let meetingUrl = dto.meetingUrl;
    let meetingEventId = record.meetingEventId;
    if (!meetingUrl) {
      if (!this.googleMeetService.isConfigured()) {
        throw new BadRequestException(
          'Google Meet 連携が未設定です。面接URLを手動で入力してください',
        );
      }
      try {
        const result = await this.googleMeetService.createOrUpdateMeeting({
          eventId: record.meetingEventId,
          summary: `面接: ${record.nameKanji} 様`,
          description: `友達先生日本語会話教室 先生応募の面接\n応募者: ${record.nameKanji}（${record.email}）`,
          start: record.interviewScheduledAt,
          attendeeEmail: record.email,
        });
        meetingUrl = result.meetingUrl;
        meetingEventId = result.eventId;
      } catch (err) {
        this.logger.error('Failed to issue Google Meet URL', err);
        throw new BadRequestException(
          'Google Meet の URL 発行に失敗しました。時間をおいて再試行するか、URLを手動で入力してください',
        );
      }
    }

    const updated = await this.prisma.teacherApplication.update({
      where: { id },
      data: { meetingUrl, meetingEventId },
    });

    if (dto.notify ?? true) {
      await this.notifyMeeting(updated).catch((err: unknown) => {
        this.logger.error(
          'Failed to send interview meeting notifications',
          err,
        );
      });
    }

    return updated;
  }

  /** API #9: 指定した先生の応募データを削除する */
  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.teacherApplication.delete({ where: { id } });
  }

  private resolveCandidateDates(dates: string[], now: Date): string[] {
    const result = normalizeInterviewCandidateDates(dates, now);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    return result.dates;
  }

  private resolveEditableCandidateDates(dates: string[]): string[] {
    const result = normalizeEditableCandidateDates(dates);
    if ('error' in result) {
      throw new BadRequestException(result.error);
    }
    return result.dates;
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
      record.interviewCandidateDates,
    );
    await this.lineService.pushMessageToGroup(groupMessage);
    await this.mailService.sendTeacherApplicationConfirmation(record.email);
  }

  private async notifyMeeting(
    record: TeacherApplicationResponseDto,
  ): Promise<void> {
    if (!record.meetingUrl || !record.interviewScheduledAt) return;
    const { nameKanji, interviewScheduledAt, meetingUrl } = record;
    await this.mailService.sendTeacherInterviewInvitation(
      record.email,
      nameKanji,
      interviewScheduledAt,
      meetingUrl,
    );
    if (record.lineUserId) {
      await this.lineService.pushMessage(
        record.lineUserId,
        buildInterviewInvitationLineMessage(
          nameKanji,
          interviewScheduledAt,
          meetingUrl,
        ),
      );
    }
    await this.lineService.pushMessageToGroup(
      buildOperatorInterviewInvitationMessage(
        nameKanji,
        interviewScheduledAt,
        meetingUrl,
      ),
    );
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
