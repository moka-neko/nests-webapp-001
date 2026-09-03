import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  MAIL_SUBJECTS,
  buildStudentApplicationConfirmationBody,
  buildTeacherApplicationConfirmationBody,
  buildTeacherHiredMailBody,
  buildTeacherInterviewMailBody,
  buildTeacherLineLinkUrl,
  buildTeacherMeetingUrlMailBody,
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

  async sendMail(to: string, subject: string, text: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log(`[Mail skipped] To: ${to}, Subject: ${subject}`);
      return;
    }

    const from =
      process.env.MAIL_FROM ?? `塾応募管理 <${process.env.MAIL_USER}>`;

    await this.getTransporter().sendMail({ from, to, subject, text });
  }

  async sendStudentApplicationConfirmation(email: string): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.studentApplicationConfirmation,
      buildStudentApplicationConfirmationBody(email),
    );
  }

  async sendTeacherApplicationConfirmation(
    email: string,
    applicationId?: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherApplicationConfirmation,
      buildTeacherApplicationConfirmationBody(
        email,
        buildTeacherLineLinkUrl(
          email,
          process.env.PUBLIC_SITE_URL,
          applicationId,
        ),
      ),
    );
  }

  async sendTeacherInterviewNotification(email: string): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherInterview,
      buildTeacherInterviewMailBody(email),
    );
  }

  async sendTeacherMeetingUrlNotification(
    email: string,
    meetingUrl: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      MAIL_SUBJECTS.teacherMeetingUrl,
      buildTeacherMeetingUrlMailBody(email, meetingUrl),
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
}
