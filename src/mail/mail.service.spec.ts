import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MAIL_SUBJECTS } from '../notification/notification-templates';

const sendMailMock = jest.fn().mockResolvedValue(undefined);

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

describe('MailService', () => {
  let service: MailService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    sendMailMock.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isConfigured', () => {
    it('MAIL_HOSTとMAIL_USERがあればtrue', () => {
      process.env.MAIL_HOST = 'smtp.example.com';
      process.env.MAIL_USER = 'user@example.com';
      expect(service.isConfigured()).toBe(true);
    });

    it('未設定時はfalse', () => {
      delete process.env.MAIL_HOST;
      delete process.env.MAIL_USER;
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('sendMail', () => {
    it('未設定時は送信をスキップする', async () => {
      delete process.env.MAIL_HOST;
      await service.sendMail('to@example.com', '件名', '本文');
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('設定済み時はメールを送信する', async () => {
      process.env.MAIL_HOST = 'smtp.example.com';
      process.env.MAIL_USER = 'noreply@example.com';
      process.env.MAIL_FROM = '塾 <noreply@example.com>';

      await service.sendMail('to@example.com', '件名', '本文');

      expect(sendMailMock).toHaveBeenCalledWith({
        from: '塾 <noreply@example.com>',
        to: 'to@example.com',
        subject: '件名',
        text: '本文',
      });
    });
  });

  describe('sendTeacherApplicationConfirmation', () => {
    it('応募確認メールを送信する', async () => {
      process.env.MAIL_HOST = 'smtp.example.com';
      process.env.MAIL_USER = 'noreply@example.com';
      const sendSpy = jest.spyOn(service, 'sendMail').mockResolvedValue();

      await service.sendTeacherApplicationConfirmation('yamada@example.com');

      expect(sendSpy).toHaveBeenCalledWith(
        'yamada@example.com',
        MAIL_SUBJECTS.teacherApplicationConfirmation,
        expect.stringContaining('yamada@example.com'),
      );
    });
  });

  describe('sendTeacherInterviewNotification', () => {
    it('面接案内メールを送信する', async () => {
      const sendSpy = jest.spyOn(service, 'sendMail').mockResolvedValue();
      await service.sendTeacherInterviewNotification('yamada@example.com');
      expect(sendSpy).toHaveBeenCalledWith(
        'yamada@example.com',
        MAIL_SUBJECTS.teacherInterview,
        expect.any(String),
      );
    });
  });

  describe('sendTeacherHiredNotification', () => {
    it('採用通知メールを送信する', async () => {
      const sendSpy = jest.spyOn(service, 'sendMail').mockResolvedValue();
      await service.sendTeacherHiredNotification('yamada@example.com');
      expect(sendSpy).toHaveBeenCalledWith(
        'yamada@example.com',
        MAIL_SUBJECTS.teacherHired,
        expect.any(String),
      );
    });
  });

  describe('sendTeacherRejectedNotification', () => {
    it('不採用通知メールを送信する', async () => {
      const sendSpy = jest.spyOn(service, 'sendMail').mockResolvedValue();
      await service.sendTeacherRejectedNotification('yamada@example.com');
      expect(sendSpy).toHaveBeenCalledWith(
        'yamada@example.com',
        MAIL_SUBJECTS.teacherRejected,
        expect.any(String),
      );
    });
  });
});
