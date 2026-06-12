import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  const prismaMock = {
    adminUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('正しい認証情報でJWTを返す', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash,
        name: '管理者',
      });
      jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.tokenType).toBe('Bearer');
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'admin-1',
        email: 'admin@example.com',
      });
    });

    it('存在しないメールアドレスでUnauthorizedException', async () => {
      prismaMock.adminUser.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('パスワード不一致でUnauthorizedException', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash,
        name: '管理者',
      });

      await expect(
        service.login({
          email: 'admin@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('管理者プロフィールを返す', () => {
      const profile = service.getProfile({
        id: 'admin-1',
        email: 'admin@example.com',
        name: '管理者',
      });

      expect(profile).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        name: '管理者',
      });
    });
  });
});
