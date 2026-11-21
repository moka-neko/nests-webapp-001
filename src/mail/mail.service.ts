import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  MAIL_SUBJECTS,
  buildInterviewInvitationMailBody,
  buildTeacherApplicationConfirmationBody,
  buildTeacherHiredMailBody,
  buildTeacherInterviewMailBody,
  buildTeacherRejectedMailBody,
} from '../notification/notification-templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER);
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT ?? 587),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  async sendMail(
    to: string | string[],
    subject: string,
    text: string,
  ): Promise<void> {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    if (!recipients) {
      this.logger.log(`[Mail skipped] No recipients, Subject: ${subject}`);
      return;
    }
    if (!this.isConfigured()) {
      this.logger.log(`[Mail skipped] To: ${recipients}, Subject: ${subject}`);
      return;
    }

    const from =
      process.env.MAIL_FROM ??
      `友達先生日本語会話教室 <${process.env.MAIL_USER}>`;

    await this.getTransporter().sendMail({
      from,
      to: recipients,
      subject,
      text,
    });
  }

  async sendTeacherApplicationConfirmation(email: string): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherApplicationConfirmation,
      buildTeacherApplicationConfirmationBody(email),
    );
  }

  async sendTeacherInterviewNotification(email: string): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherInterview,
      buildTeacherInterviewMailBody(email),
    );
  }

  async sendTeacherHiredNotification(email: string): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherHired,
      buildTeacherHiredMailBody(),
    );
  }

  async sendTeacherRejectedNotification(email: string): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherRejected,
      buildTeacherRejectedMailBody(),
    );
  }

  async sendTeacherInterviewInvitation(
    email: string,
    nameKanji: string,
    scheduledAt: Date,
    meetingUrl: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherInterviewInvitation,
      buildInterviewInvitationMailBody(nameKanji, scheduledAt, meetingUrl),
    );
  }
}
