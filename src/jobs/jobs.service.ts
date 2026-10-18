import { Injectable, Logger } from '@nestjs/common';
import { TeacherApplicationStatus } from '@prisma/client';
import { LineService } from '../line/line.service';
import {
  buildAdminInterviewEditUrl,
  buildWeeklyInterviewReminderMessages,
} from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { getTokyoWeekDates } from '../teachers/interview-calendar';
import { WeeklyInterviewReminderResponseDto } from './dto/weekly-interview-reminder-response.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
  ) {}

  /**
   * 今週の面接候補日がある応募者について、運営グループへ編集依頼を送る。
   * 面接編集は応募者ごとの画面なので、名前と編集URLを1人ずつ載せる。
   */
  async sendWeeklyInterviewReminder(options?: {
    force?: boolean;
    now?: Date;
  }): Promise<WeeklyInterviewReminderResponseDto> {
    const now = options?.now ?? new Date();
    const weekDates = getTokyoWeekDates(now);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const base = {
      weekStart,
      weekEnd,
      notified: false,
      alreadySent: false,
      applicantCount: 0,
      messageCount: 0,
    };

    const existing = await this.prisma.weeklyInterviewReminder.findUnique({
      where: { weekStart },
    });
    if (existing && !options?.force) {
      return {
        ...base,
        alreadySent: true,
        applicantCount: existing.applicantCount,
      };
    }

    const weekSet = new Set(weekDates);
    const openStatuses = new Set<TeacherApplicationStatus>([
      TeacherApplicationStatus.PENDING,
      TeacherApplicationStatus.INTERVIEW,
    ]);
    const records = await this.prisma.teacherApplication.findMany({
      where: {
        status: { in: [...openStatuses] },
        interviewCandidateDates: { hasSome: weekDates },
      },
    });

    const adminBaseUrl =
      process.env.ADMIN_APP_BASE_URL ?? 'http://localhost:5173';
    const applicants = records
      .filter((record) => openStatuses.has(record.status))
      .map((record) => ({
        nameKanji: record.nameKanji,
        earliest: record.interviewCandidateDates
          .filter((date) => weekSet.has(date))
          .sort()[0],
        editUrl: buildAdminInterviewEditUrl(adminBaseUrl, record.id),
      }))
      .filter((applicant) => applicant.earliest)
      .sort((a, b) =>
        a.earliest === b.earliest
          ? a.nameKanji.localeCompare(b.nameKanji, 'ja')
          : a.earliest.localeCompare(b.earliest),
      );

    if (applicants.length === 0) {
      return base;
    }

    const messages = buildWeeklyInterviewReminderMessages(applicants);
    for (const message of messages) {
      await this.lineService.pushMessageToGroup(message);
    }

    await this.prisma.weeklyInterviewReminder.upsert({
      where: { weekStart },
      create: { weekStart, applicantCount: applicants.length },
      update: { applicantCount: applicants.length, sentAt: now },
    });

    this.logger.log(
      `Weekly interview reminder sent: week=${weekStart} applicants=${applicants.length}`,
    );

    return {
      ...base,
      notified: true,
      applicantCount: applicants.length,
      messageCount: messages.length,
    };
  }
}
