import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('指定 ID の生徒応募データを返す', async () => {
      prismaMock.studentApplication.findUnique.mockResolvedValue(mockStudent);

      const result = await service.findOne(mockStudent.id);

      expect(result).toEqual(mockStudent);
      expect(prismaMock.studentApplication.findUnique).toHaveBeenCalledWith({
        where: { id: mockStudent.id },
      });
    });

    it('存在しない ID の場合 NotFoundException を投げる', async () => {
      prismaMock.studentApplication.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
