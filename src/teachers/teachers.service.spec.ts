import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TeachersService } from './teachers.service';
import { TeacherApplicationStatus } from './enums/teacher-application-status.enum';

describe('TeachersService', () => {
  let service: TeachersService;

  const mockTeacher = {
    id: 'teacher-uuid-1',
    email: 'yamada@example.com',
    nameKanji: '山田 太郎',
    nameKatakana: 'ヤマダ タロウ',
    age: 25,
    workLocation: '東京都渋谷区',
    resumeUrl: 'https://drive.google.com/file/d/xxxxx',
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('指定 ID の先生応募データを返す', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(mockTeacher);

      const result = await service.findOne(mockTeacher.id);

      expect(result).toEqual(mockTeacher);
      expect(prismaMock.teacherApplication.findUnique).toHaveBeenCalledWith({
        where: { id: mockTeacher.id },
      });
    });

    it('存在しない ID の場合 NotFoundException を投げる', async () => {
      prismaMock.teacherApplication.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
