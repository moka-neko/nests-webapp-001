import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DevSeedService } from './dev-seed.service';

describe('DevSeedService', () => {
  let service: DevSeedService;
  const originalEnv = { ...process.env };

  const prismaMock = {
    teacherApplication: {
      createMany: jest.fn(),
    },
    studentApplication: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    prismaMock.teacherApplication.createMany.mockResolvedValue({ count: 5 });
    prismaMock.studentApplication.createMany.mockResolvedValue({ count: 5 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevSeedService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DevSeedService>(DevSeedService);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('開発環境（NODE_ENV未設定）では起動時にテストデータを登録する', async () => {
    delete process.env.NODE_ENV;
    delete process.env.SEED_DEV_DATA;

    await service.onModuleInit();

    expect(prismaMock.teacherApplication.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(prismaMock.studentApplication.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it('NODE_ENV=production では絶対にテストデータを登録しない', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SEED_DEV_DATA = 'true';

    await service.onModuleInit();

    expect(prismaMock.teacherApplication.createMany).not.toHaveBeenCalled();
    expect(prismaMock.studentApplication.createMany).not.toHaveBeenCalled();
  });

  it('NODE_ENV=test では既定でテストデータを登録しない', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.SEED_DEV_DATA;

    await service.onModuleInit();

    expect(prismaMock.teacherApplication.createMany).not.toHaveBeenCalled();
    expect(prismaMock.studentApplication.createMany).not.toHaveBeenCalled();
  });

  it('NODE_ENV=test でも SEED_DEV_DATA=true なら明示的に登録する', async () => {
    process.env.NODE_ENV = 'test';
    process.env.SEED_DEV_DATA = 'true';

    await service.onModuleInit();

    expect(prismaMock.teacherApplication.createMany).toHaveBeenCalled();
    expect(prismaMock.studentApplication.createMany).toHaveBeenCalled();
  });

  it('SEED_DEV_DATA=false を指定すると開発環境でも登録しない', async () => {
    delete process.env.NODE_ENV;
    process.env.SEED_DEV_DATA = 'false';

    await service.onModuleInit();

    expect(prismaMock.teacherApplication.createMany).not.toHaveBeenCalled();
    expect(prismaMock.studentApplication.createMany).not.toHaveBeenCalled();
  });
});
