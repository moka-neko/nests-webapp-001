import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeacherApplicationStatus } from '@prisma/client';
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
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LineService, useValue: lineServiceMock },
        { provide: MailService, useValue: mailServiceMock },
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

      expect(mailServiceMock.sendTeacherInterviewNotification).toHaveBeenCalledWith(
        'yamada@example.com',
      );
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
});
