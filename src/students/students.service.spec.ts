import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LineService } from '../line/line.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;

  const mockStudent = {
    id: 'student-uuid-1',
    email: 'suzuki@example.com',
    name: '鈴木 花子',
    phoneNumber: '090-9876-5432',
    nationality: '日本',
    questions: null,
    submittedAt: new Date('2026-06-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-01T10:00:00.000Z'),
  };

  const prismaMock = {
    studentApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const lineServiceMock = {
    pushMessageToGroup: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LineService, useValue: lineServiceMock },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('応募を作成し運営グループへLINE通知する', async () => {
      prismaMock.studentApplication.create.mockResolvedValue(mockStudent);

      const result = await service.create({
        email: mockStudent.email,
        name: mockStudent.name,
        phoneNumber: mockStudent.phoneNumber,
        nationality: mockStudent.nationality,
      });

      expect(result).toEqual(mockStudent);
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledWith(
        expect.stringContaining('鈴木 花子'),
      );
    });
  });

  describe('findAll', () => {
    it('応募一覧を取得する', async () => {
      prismaMock.studentApplication.findMany.mockResolvedValue([mockStudent]);
      const result = await service.findAll();
      expect(result).toEqual([mockStudent]);
    });
  });

  describe('update', () => {
    it('基本情報を更新する', async () => {
      prismaMock.studentApplication.findUnique.mockResolvedValue(mockStudent);
      prismaMock.studentApplication.update.mockResolvedValue({
        ...mockStudent,
        name: '鈴木 一郎',
      });

      const result = await service.update('student-uuid-1', {
        name: '鈴木 一郎',
        phoneNumber: '090-1111-2222',
        nationality: '日本',
      });

      expect(result.name).toBe('鈴木 一郎');
    });

    it('存在しないIDの場合はNotFoundException', async () => {
      prismaMock.studentApplication.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', {
          name: 'test',
          phoneNumber: '090',
          nationality: '日本',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('応募データを削除する', async () => {
      prismaMock.studentApplication.findUnique.mockResolvedValue(mockStudent);
      prismaMock.studentApplication.delete.mockResolvedValue(mockStudent);

      await service.remove('student-uuid-1');

      expect(prismaMock.studentApplication.delete).toHaveBeenCalledWith({
        where: { id: 'student-uuid-1' },
      });
    });
  });
});
