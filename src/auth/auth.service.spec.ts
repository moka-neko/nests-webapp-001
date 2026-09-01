import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LineService } from '../line/line.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const lineServiceMock = {
    defaultRedirectUri: 'http://localhost:3000/api/v1/auth/line/callback',
    addFriendUrl: 'https://line.me/R/ti/p/@example',
    resolveAddFriendUrl: jest.fn(),
    buildLoginUrl: jest.fn(),
    exchangeToken: jest.fn(),
    getUserProfile: jest.fn(),
    getFriendshipStatus: jest.fn(),
    parseOAuthState: jest.fn((state: string) => ({
      email: decodeURIComponent(state),
    })),
  };

  const prismaMock = {
    teacherApplication: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: LineService, useValue: lineServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLineLoginUrl', () => {
    it('LINE認証URLを返す', () => {
      lineServiceMock.buildLoginUrl.mockReturnValue(
        'https://access.line.me/oauth2/v2.1/authorize?...',
      );

      const result = service.getLineLoginUrl({
        email: 'yamada@example.com',
      });

      expect(result.url).toContain('access.line.me');
      expect(lineServiceMock.buildLoginUrl).toHaveBeenCalledWith(
        'yamada@example.com',
        'http://localhost:3000/api/v1/auth/line/callback',
        undefined,
        undefined,
      );
    });
  });

  describe('handleLineCallback', () => {
    const mockTeacher = {
      id: 'teacher-uuid-1',
      email: 'yamada@example.com',
      lineUserId: null,
      lineDisplayName: null,
    };

    it('LINE連携を完了しDBを更新する', async () => {
      lineServiceMock.exchangeToken.mockResolvedValue({
        access_token: 'token-abc',
      });
      lineServiceMock.getUserProfile.mockResolvedValue({
        userId: 'U123',
        displayName: '山田 太郎',
      });
      lineServiceMock.getFriendshipStatus.mockResolvedValue(false);
      lineServiceMock.resolveAddFriendUrl.mockResolvedValue(
        'https://line.me/R/ti/p/@example',
      );
      prismaMock.teacherApplication.findFirst.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.update.mockResolvedValue({
        ...mockTeacher,
        lineUserId: 'U123',
        lineDisplayName: '山田 太郎',
      });

      const result = await service.handleLineCallback({
        code: 'auth-code',
        state: encodeURIComponent('yamada@example.com'),
      });

      expect(result).toEqual({
        message: 'LINE連携が完了しました。',
        userId: 'teacher-uuid-1',
        lineUserId: 'U123',
        lineDisplayName: '山田 太郎',
        friendFlag: false,
        addFriendUrl: 'https://line.me/R/ti/p/@example',
      });
      expect(prismaMock.teacherApplication.findFirst).toHaveBeenCalledWith({
        where: { email: 'yamada@example.com' },
        orderBy: { submittedAt: 'desc' },
      });
      expect(prismaMock.teacherApplication.update).toHaveBeenCalledWith({
        where: { id: 'teacher-uuid-1' },
        data: {
          lineUserId: 'U123',
          lineDisplayName: '山田 太郎',
        },
      });
    });

    it('メールアドレスに一致する応募者がいない場合はNotFoundException', async () => {
      lineServiceMock.exchangeToken.mockResolvedValue({
        access_token: 'token-abc',
      });
      lineServiceMock.getUserProfile.mockResolvedValue({
        userId: 'U123',
        displayName: '山田 太郎',
      });
      prismaMock.teacherApplication.findFirst.mockResolvedValue(null);

      await expect(
        service.handleLineCallback({
          code: 'auth-code',
          state: encodeURIComponent('unknown@example.com'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('applicationIdがある場合はその応募レコードを更新する', async () => {
      lineServiceMock.parseOAuthState.mockReturnValueOnce({
        email: 'yamada@example.com',
        applicationId: 'teacher-uuid-1',
      });
      lineServiceMock.exchangeToken.mockResolvedValue({
        access_token: 'token-abc',
      });
      lineServiceMock.getUserProfile.mockResolvedValue({
        userId: 'U123',
        displayName: '山田 太郎',
      });
      lineServiceMock.getFriendshipStatus.mockResolvedValue(true);
      lineServiceMock.resolveAddFriendUrl.mockResolvedValue(
        'https://line.me/R/ti/p/@example',
      );
      prismaMock.teacherApplication.findFirst.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.update.mockResolvedValue({
        ...mockTeacher,
        lineUserId: 'U123',
        lineDisplayName: '山田 太郎',
      });

      await service.handleLineCallback({
        code: 'auth-code',
        state: 'state-with-id',
      });

      expect(prismaMock.teacherApplication.findFirst).toHaveBeenCalledWith({
        where: { id: 'teacher-uuid-1', email: 'yamada@example.com' },
      });
    });
  });
});
