import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('StudentsController', () => {
  let controller: StudentsController;

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

  const studentsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: StudentsService, useValue: studentsServiceMock },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('StudentsService.findOne を呼び出して結果を返す', async () => {
      studentsServiceMock.findOne.mockResolvedValue(mockStudent);

      const result = await controller.findOne(mockStudent.id);

      expect(result).toEqual(mockStudent);
      expect(studentsServiceMock.findOne).toHaveBeenCalledWith(mockStudent.id);
    });
  });
});
