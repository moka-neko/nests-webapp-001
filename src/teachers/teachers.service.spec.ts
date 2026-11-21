import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeacherApplicationStatus } from '@prisma/client';
import { GoogleMeetService } from '../google/google-meet.service';
import { LineService } from '../line/line.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeachersService } from './teachers.service';

describe('TeachersService', () => {
  let service: TeachersService;

  const mockTeacher = {
    id: 'teacher-uuid-1',
    email: 'yamada@example.com',
    nameKanji: '山田 太郎',
    nameKatakana: 'ヤマダ タロウ',
    age: 25,
    workLocation: '東京都',
    resumeUrl: 'https://drive.google.com/file/d/abc',
    questions: null,
    status: TeacherApplicationStatus.PENDING,
    lineDisplayName: null,
    lineUserId: null,
    meetingUrl: null,
    meetingEventId: null,
    interviewCandidateDates: [] as string[],
    interviewScheduledAt: null,
    submittedAt: new Date('2026-06-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-01T10:00:00.000Z'),
  };

  const prismaMock = {
    teacherApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const lineServiceMock = {
    pushMessageToGroup: jest.fn().mockResolvedValue(undefined),
    pushMessage: jest.fn().mockResolvedValue(undefined),
  };

  const mailServiceMock = {
    sendTeacherApplicationConfirmation: jest.fn().mockResolvedValue(undefined),
    sendTeacherInterviewNotification: jest.fn().mockResolvedValue(undefined),
    sendTeacherHiredNotification: jest.fn().mockResolvedValue(undefined),
    sendTeacherRejectedNotification: jest.fn().mockResolvedValue(undefined),
    sendTeacherInterviewInvitation: jest.fn().mockResolvedValue(undefined),
  };

  const googleMeetServiceMock = {
    isConfigured: jest.fn().mockReturnValue(true),
    createOrUpdateMeeting: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LineService, useValue: lineServiceMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: GoogleMeetService, useValue: googleMeetServiceMock },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('応募を作成し運営LINE通知と確認メールを送信する', async () => {
      prismaMock.teacherApplication.create.mockResolvedValue(mockTeacher);

      const dto = {
        email: mockTeacher.email,
        nameKanji: mockTeacher.nameKanji,
        nameKatakana: mockTeacher.nameKatakana,
        age: mockTeacher.age,
        workLocation: mockTeacher.workLocation,
        resumeUrl: mockTeacher.resumeUrl,
      };

      const result = await service.create(dto);

      expect(result).toEqual(mockTeacher);
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledWith(
        expect.stringContaining('山田 太郎'),
      );
      expect(
        mailServiceMock.sendTeacherApplicationConfirmation,
      ).toHaveBeenCalledWith('yamada@example.com');
    });

    it('表示期間内の面接候補日を保存する', async () => {
      prismaMock.teacherApplication.create.mockResolvedValue({
        ...mockTeacher,
        interviewCandidateDates: ['2026-10-19', '2026-10-21'],
      });

      await service.create(
        {
          email: mockTeacher.email,
          nameKanji: mockTeacher.nameKanji,
          nameKatakana: mockTeacher.nameKatakana,
          age: mockTeacher.age,
          workLocation: mockTeacher.workLocation,
          resumeUrl: mockTeacher.resumeUrl,
          interviewCandidateDates: ['2026-10-21', '2026-10-19'],
        },
        new Date('2026-10-04T03:00:00.000Z'),
      );

      const createCalls = prismaMock.teacherApplication.create.mock
        .calls as unknown as Array<
        [{ data: { interviewCandidateDates: string[] } }]
      >;
      expect(createCalls[0][0].data.interviewCandidateDates).toEqual([
        '2026-10-19',
        '2026-10-21',
      ]);
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledWith(
        expect.stringContaining('2026-10-19, 2026-10-21'),
      );
    });

    it('表示期間外の面接候補日は拒否する', async () => {
      await expect(
        service.create(
          {
            email: mockTeacher.email,
            nameKanji: mockTeacher.nameKanji,
            nameKatakana: mockTeacher.nameKatakana,
            age: mockTeacher.age,
            workLocation: mockTeacher.workLocation,
            resumeUrl: mockTeacher.resumeUrl,
            interviewCandidateDates: ['2026-10-12'],
          },
          new Date('2026-10-04T03:00:00.000Z'),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.teacherApplication.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('応募一覧を取得する', async () => {
      prismaMock.teacherApplication.findMany.mockResolvedValue([mockTeacher]);
      const result = await service.findAll();
      expect(result).toEqual([mockTeacher]);
    });
  });

  describe('updateStatus', () => {
    it('面接ステータス更新時に面接案内メールを送信する', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);
      const interviewRecord = {
        ...mockTeacher,
        status: TeacherApplicationStatus.INTERVIEW,
      };
      prismaMock.teacherApplication.update.mockResolvedValue(interviewRecord);

      await service.updateStatus('teacher-uuid-1', {
        status: TeacherApplicationStatus.INTERVIEW,
      });

      expect(
        mailServiceMock.sendTeacherInterviewNotification,
      ).toHaveBeenCalledWith('yamada@example.com');
    });

    it('採用時にメールとLINE個別通知を送信する', async () => {
      const hiredTeacher = {
        ...mockTeacher,
        status: TeacherApplicationStatus.HIRED,
        lineUserId: 'U123',
      };
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.update.mockResolvedValue(hiredTeacher);

      await service.updateStatus('teacher-uuid-1', {
        status: TeacherApplicationStatus.HIRED,
      });

      expect(mailServiceMock.sendTeacherHiredNotification).toHaveBeenCalledWith(
        'yamada@example.com',
      );
      expect(lineServiceMock.pushMessage).toHaveBeenCalledWith(
        'U123',
        expect.any(String),
      );
    });

    it('不採用時にメールとLINE個別通知を送信する', async () => {
      const rejectedTeacher = {
        ...mockTeacher,
        status: TeacherApplicationStatus.REJECTED,
        lineUserId: 'U123',
      };
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.update.mockResolvedValue(rejectedTeacher);

      await service.updateStatus('teacher-uuid-1', {
        status: TeacherApplicationStatus.REJECTED,
      });

      expect(
        mailServiceMock.sendTeacherRejectedNotification,
      ).toHaveBeenCalledWith('yamada@example.com');
      expect(lineServiceMock.pushMessage).toHaveBeenCalledWith(
        'U123',
        expect.any(String),
      );
    });

    it('存在しないIDの場合はNotFoundException', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('missing', {
          status: TeacherApplicationStatus.HIRED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('基本情報を更新する', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.update.mockResolvedValue({
        ...mockTeacher,
        nameKanji: '山田 次郎',
      });

      const result = await service.update('teacher-uuid-1', {
        nameKanji: '山田 次郎',
        nameKatakana: 'ヤマダ ジロウ',
        age: 26,
        workLocation: '大阪府',
        resumeUrl: 'https://drive.google.com/file/d/xyz',
      });

      expect(result.nameKanji).toBe('山田 次郎');
    });
  });

  describe('remove', () => {
    it('応募データを削除する', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.delete.mockResolvedValue(mockTeacher);

      await service.remove('teacher-uuid-1');

      expect(prismaMock.teacherApplication.delete).toHaveBeenCalledWith({
        where: { id: 'teacher-uuid-1' },
      });
    });
  });

  describe('findWeeklyInterviews', () => {
    it('指定日を含む週の選考中応募者を候補日順に返す', async () => {
      prismaMock.teacherApplication.findMany.mockResolvedValue([
        {
          ...mockTeacher,
          id: 'b',
          nameKanji: '佐藤 花子',
          interviewCandidateDates: ['2026-10-23'],
        },
        {
          ...mockTeacher,
          id: 'a',
          interviewCandidateDates: ['2026-10-12', '2026-10-20'],
        },
      ]);

      const result = await service.findWeeklyInterviews('2026-10-22');

      expect(result.weekStart).toBe('2026-10-19');
      expect(result.weekEnd).toBe('2026-10-25');
      expect(result.applications.map((a) => a.id)).toEqual(['a', 'b']);
      expect(result.applications[0].earliestCandidateDate).toBe('2026-10-20');
    });

    it('week の形式が不正なら BadRequestException', async () => {
      await expect(service.findWeeklyInterviews('2026/10/22')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('issueMeeting', () => {
    const scheduledAt = new Date('2026-10-21T05:00:00.000Z');
    const scheduled = {
      ...mockTeacher,
      interviewScheduledAt: scheduledAt,
      lineUserId: 'U-teacher',
    };

    it('Google Meet の URL を発行して保存し、応募者と運営へ通知する', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(scheduled);
      googleMeetServiceMock.createOrUpdateMeeting.mockResolvedValue({
        eventId: 'event-1',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      });
      prismaMock.teacherApplication.update.mockImplementation(
        ({ data }: { data: object }) =>
          Promise.resolve({ ...scheduled, ...data }),
      );

      const result = await service.issueMeeting(scheduled.id, {});

      expect(googleMeetServiceMock.createOrUpdateMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: null,
          start: scheduledAt,
          attendeeEmail: 'yamada@example.com',
        }),
      );
      expect(prismaMock.teacherApplication.update).toHaveBeenCalledWith({
        where: { id: scheduled.id },
        data: {
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          meetingEventId: 'event-1',
        },
      });
      expect(result.meetingUrl).toBe('https://meet.google.com/abc-defg-hij');
      expect(
        mailServiceMock.sendTeacherInterviewInvitation,
      ).toHaveBeenCalledWith(
        'yamada@example.com',
        '山田 太郎',
        scheduledAt,
        'https://meet.google.com/abc-defg-hij',
      );
      expect(lineServiceMock.pushMessage).toHaveBeenCalledWith(
        'U-teacher',
        expect.stringContaining('2026年10月21日(水) 14:00'),
      );
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledWith(
        expect.stringContaining('【面接URL発行】'),
      );
    });

    it('手動URLを指定した場合は Google を使わずに登録して通知する', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(scheduled);
      prismaMock.teacherApplication.update.mockImplementation(
        ({ data }: { data: object }) =>
          Promise.resolve({ ...scheduled, ...data }),
      );

      await service.issueMeeting(scheduled.id, {
        meetingUrl: 'https://meet.google.com/manual-url',
      });

      expect(
        googleMeetServiceMock.createOrUpdateMeeting,
      ).not.toHaveBeenCalled();
      expect(mailServiceMock.sendTeacherInterviewInvitation).toHaveBeenCalled();
    });

    it('notify=false なら通知しない', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(scheduled);
      prismaMock.teacherApplication.update.mockImplementation(
        ({ data }: { data: object }) =>
          Promise.resolve({ ...scheduled, ...data }),
      );

      await service.issueMeeting(scheduled.id, {
        meetingUrl: 'https://meet.google.com/manual-url',
        notify: false,
      });

      expect(
        mailServiceMock.sendTeacherInterviewInvitation,
      ).not.toHaveBeenCalled();
      expect(lineServiceMock.pushMessageToGroup).not.toHaveBeenCalled();
    });

    it('確定面接日時が未設定なら BadRequestException', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);

      await expect(service.issueMeeting(mockTeacher.id, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Google 連携が未設定で URL 指定もなければ BadRequestException', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(scheduled);
      googleMeetServiceMock.isConfigured.mockReturnValueOnce(false);

      await expect(service.issueMeeting(scheduled.id, {})).rejects.toThrow(
        'Google Meet 連携が未設定です',
      );
    });
  });
});
