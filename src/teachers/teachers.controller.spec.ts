import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

describe('TeachersController', () => {
  let controller: TeachersController;

  const teachersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const storageServiceMock = {
    uploadTeacherPhoto: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [
        { provide: TeachersService, useValue: teachersServiceMock },
        { provide: SupabaseStorageService, useValue: storageServiceMock },
      ],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadPhoto', () => {
    it('顔写真をアップロードし公開URLを返す', async () => {
      storageServiceMock.uploadTeacherPhoto.mockResolvedValue(
        'https://xxxx.supabase.co/storage/v1/object/public/teacher-photos/photos/abc.jpg',
      );

      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      } as Express.Multer.File;

      const result = await controller.uploadPhoto(file);

      expect(storageServiceMock.uploadTeacherPhoto).toHaveBeenCalledWith(file);
      expect(result).toEqual({
        photoUrl:
          'https://xxxx.supabase.co/storage/v1/object/public/teacher-photos/photos/abc.jpg',
      });
    });
  });
});
