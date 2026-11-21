import { Test, TestingModule } from '@nestjs/testing';
import { TeacherApplicationStatus } from '@prisma/client';
import { LineService } from '../line/line.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  const prismaMock = {
    weeklyInterviewReminder: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    teacherApplication: {
      findMany: jest.fn(),
    },
    adminUser: {
      findMany: jest.fn(),
    },
  };

  const mailServiceMock = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

  const lineServiceMock = {
    pushMessageToGroup: jest.fn().mockResolvedValue(undefined),
  };

  const now = new Date('2026-10-19T00:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.ADMIN_APP_BASE_URL = 'https://admin.example.com';
    delete process.env.OPERATOR_NOTIFICATION_EMAILS;
    prismaMock.adminUser.findMany.mockResolvedValue([
      { email: 'admin@example.com' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LineService, useValue: lineServiceMock },
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  it('今週の候補日がある応募者がいれば、面接日程調整URLを1つだけLINEとメールで通知する', async () => {
    prismaMock.weeklyInterviewReminder.findUnique.mockResolvedValue(null);
    prismaMock.weeklyInterviewReminder.upsert.mockResolvedValue({});
    prismaMock.teacherApplication.findMany.mockResolvedValue([
      {
        id: 'later',
        nameKanji: '佐藤 花子',
        status: TeacherApplicationStatus.INTERVIEW,
        interviewCandidateDates: ['2026-10-21'],
      },
      {
        id: 'hired',
        nameKanji: '採用済み',
        status: TeacherApplicationStatus.HIRED,
        interviewCandidateDates: ['2026-10-19'],
      },
      {
        id: 'earlier',
        nameKanji: '山田 太郎',
        status: TeacherApplicationStatus.PENDING,
        interviewCandidateDates: ['2026-10-19', '2026-11-02'],
      },
      {
        id: 'other-week',
        nameKanji: '来週さん',
        status: TeacherApplicationStatus.PENDING,
        interviewCandidateDates: ['2026-10-26'],
      },
    ]);

    const result = await service.sendWeeklyInterviewReminder({ now });

    expect(result).toMatchObject({
      notified: true,
      alreadySent: false,
      applicantCount: 2,
      mailRecipientCount: 1,
      weekStart: '2026-10-19',
      weekEnd: '2026-10-25',
      scheduleUrl: 'https://admin.example.com/interviews?week=2026-10-19',
    });
    const expectedMessage =
      '今週の面接日程を日曜日までに編集をお願いいたします。\n面接日程調整URL\nhttps://admin.example.com/interviews?week=2026-10-19';
    expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledTimes(1);
    expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledWith(
      expectedMessage,
    );
    expect(mailServiceMock.sendMail).toHaveBeenCalledWith(
      ['admin@example.com'],
      '【面接日程の編集のお願い】',
      expectedMessage,
    );
    expect(prismaMock.weeklyInterviewReminder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { weekStart: '2026-10-19', applicantCount: 2 },
      }),
    );
  });

  it('OPERATOR_NOTIFICATION_EMAILS があればその宛先へメールする', async () => {
    process.env.OPERATOR_NOTIFICATION_EMAILS =
      'ops1@example.com, ops2@example.com,ops1@example.com';
    prismaMock.weeklyInterviewReminder.findUnique.mockResolvedValue(null);
    prismaMock.weeklyInterviewReminder.upsert.mockResolvedValue({});
    prismaMock.teacherApplication.findMany.mockResolvedValue([
      {
        id: 'a',
        nameKanji: '山田 太郎',
        status: TeacherApplicationStatus.PENDING,
        interviewCandidateDates: ['2026-10-20'],
      },
    ]);

    await service.sendWeeklyInterviewReminder({ now });

    expect(mailServiceMock.sendMail).toHaveBeenCalledWith(
      ['ops1@example.com', 'ops2@example.com'],
      expect.any(String),
      expect.any(String),
    );
    expect(prismaMock.adminUser.findMany).not.toHaveBeenCalled();
  });

  it('対象がいない週は通知しない', async () => {
    prismaMock.weeklyInterviewReminder.findUnique.mockResolvedValue(null);
    prismaMock.teacherApplication.findMany.mockResolvedValue([]);

    const result = await service.sendWeeklyInterviewReminder({ now });

    expect(result.notified).toBe(false);
    expect(result.applicantCount).toBe(0);
    expect(lineServiceMock.pushMessageToGroup).not.toHaveBeenCalled();
    expect(mailServiceMock.sendMail).not.toHaveBeenCalled();
    expect(prismaMock.weeklyInterviewReminder.upsert).not.toHaveBeenCalled();
  });

  it('同じ週の再送は force がない限り行わない', async () => {
    prismaMock.weeklyInterviewReminder.findUnique.mockResolvedValue({
      weekStart: '2026-10-19',
      applicantCount: 3,
    });

    const result = await service.sendWeeklyInterviewReminder({ now });

    expect(result).toMatchObject({
      notified: false,
      alreadySent: true,
      applicantCount: 3,
    });
    expect(prismaMock.teacherApplication.findMany).not.toHaveBeenCalled();
  });
});
