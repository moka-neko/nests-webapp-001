import { Injectable, Logger } from '@nestjs/common';
import { LineService } from '../line/line.service';
import { MailService } from '../mail/mail.service';
import {
  MAIL_SUBJECTS,
  buildAdminInterviewScheduleUrl,
  buildWeeklyInterviewReminderMessage,
} from '../notification/notification-templates';
import { PrismaService } from '../prisma/prisma.service';
import { getTokyoWeekDates } from '../teachers/interview-calendar';
import { findWeeklyInterviewApplications } from '../teachers/weekly-interviews';
import { WeeklyInterviewReminderResponseDto } from './dto/weekly-interview-reminder-response.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 今週の面接候補日がある応募者がいれば、運営へ編集依頼をグループLINEとメールで送る。
   * URL は管理画面の「面接日程調整」ページ1つだけを載せ、
   * 開いた先で担当する応募者を選んで編集画面へ移る。
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
      mailRecipientCount: 0,
      scheduleUrl: '',
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

    const applicants = await findWeeklyInterviewApplications(
      this.prisma,
      weekDates,
    );
    if (applicants.length === 0) {
      return base;
    }

    const adminBaseUrl =
      process.env.ADMIN_APP_BASE_URL ?? 'http://localhost:5173';
    const scheduleUrl = buildAdminInterviewScheduleUrl(adminBaseUrl, weekStart);
    const message = buildWeeklyInterviewReminderMessage(scheduleUrl);
    const mailRecipients = await this.resolveOperatorEmails();

    await this.lineService.pushMessageToGroup(message);
    await this.mailService.sendMail(
      mailRecipients,
      MAIL_SUBJECTS.weeklyInterviewReminder,
      message,
    );

    await this.prisma.weeklyInterviewReminder.upsert({
      where: { weekStart },
      create: { weekStart, applicantCount: applicants.length },
      update: { applicantCount: applicants.length, sentAt: now },
    });

    this.logger.log(
      `Weekly interview reminder sent: week=${weekStart} applicants=${applicants.length} mails=${mailRecipients.length}`,
    );

    return {
      ...base,
      notified: true,
      applicantCount: applicants.length,
      mailRecipientCount: mailRecipients.length,
      scheduleUrl,
    };
  }

  /**
   * 運営のメール送信先。OPERATOR_NOTIFICATION_EMAILS（カンマ区切り）を優先し、
   * 未設定なら管理画面の管理者アカウントのメールアドレスへ送る。
   */
  private async resolveOperatorEmails(): Promise<string[]> {
    const configured = (process.env.OPERATOR_NOTIFICATION_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
    if (configured.length > 0) {
      return [...new Set(configured)];
    }
    const admins = await this.prisma.adminUser.findMany({
      select: { email: true },
    });
    return [...new Set(admins.map((admin) => admin.email))];
  }
}
