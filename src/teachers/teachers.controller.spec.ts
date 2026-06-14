import { Test, TestingModule } from '@nestjs/testing';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeacherApplicationStatus } from './enums/teacher-application-status.enum';

describe('TeachersController', () => {
  let controller: TeachersController;

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

  const teachersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [
        { provide: TeachersService, useValue: teachersServiceMock },
      ],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('TeachersService.findOne を呼び出して結果を返す', async () => {
      teachersServiceMock.findOne.mockResolvedValue(mockTeacher);

      const result = await controller.findOne(mockTeacher.id);

      expect(result).toEqual(mockTeacher);
      expect(teachersServiceMock.findOne).toHaveBeenCalledWith(mockTeacher.id);
    });
  });
});
