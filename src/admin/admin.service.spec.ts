import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { TotpService } from './totp.service';

describe('AdminService', () => {
  let service: AdminService;

  const prismaMock = {
    adminUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const totpServiceMock = {
    generateSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
    generateOtpAuthUrl: jest.fn(() => 'otpauth://totp/test'),
    generateQrCodeDataUrl: jest.fn(async () => 'data:image/png;base64,abc'),
    verifyCode: jest.fn(async () => true),
    encryptSecret: jest.fn((s: string) => `enc:${s}`),
    decryptSecret: jest.fn((s: string) => s.replace('enc:', '')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: TotpService, useValue: totpServiceMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('TOTP 未設定時は JWT を返す', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash,
        name: '管理者',
        totpEnabled: false,
      });
      jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.mfaRequired).toBe(false);
      expect(result.accessToken).toBe('jwt-token');
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'admin-1',
        email: 'admin@example.com',
        purpose: 'access',
      });
    });

    it('TOTP 有効時は mfaToken を返す', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash,
        name: '管理者',
        totpEnabled: true,
        totpSecret: 'encrypted',
      });
      jwtServiceMock.signAsync.mockResolvedValue('mfa-token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.mfaRequired).toBe(true);
      expect(result.mfaToken).toBe('mfa-token');
      expect(result.accessToken).toBeUndefined();
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
  });

  describe('verifyMfa', () => {
    it('正しい TOTP コードで JWT を返す', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'admin-1',
        email: 'admin@example.com',
        purpose: 'mfa',
      });
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        totpEnabled: true,
        totpSecret: 'enc:secret',
      });
      jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

      const result = await service.verifyMfa({
        mfaToken: 'valid-mfa-token',
        code: '123456',
      });

      expect(result.mfaRequired).toBe(false);
      expect(result.accessToken).toBe('jwt-token');
    });
  });

  describe('setupMfa', () => {
    it('QR コード情報を返しシークレットを保存する', async () => {
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        totpEnabled: false,
      });
      prismaMock.adminUser.update.mockResolvedValue({});

      const result = await service.setupMfa('admin-1');

      expect(result.otpAuthUrl).toContain('otpauth://');
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(prismaMock.adminUser.update).toHaveBeenCalled();
    });
  });

  describe('enableMfa', () => {
    it('正しいコードで TOTP を有効化する', async () => {
      prismaMock.adminUser.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        name: '管理者',
        totpEnabled: false,
        totpSecret: 'enc:secret',
      });
      prismaMock.adminUser.update.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        name: '管理者',
        totpEnabled: true,
      });

      const result = await service.enableMfa('admin-1', '123456');

      expect(result.totpEnabled).toBe(true);
    });
  });
});
