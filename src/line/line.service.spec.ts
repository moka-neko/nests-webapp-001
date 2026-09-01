import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LineService } from './line.service';

describe('LineService', () => {
  let service: LineService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const module: TestingModule = await Test.createTestingModule({
      providers: [LineService],
    }).compile();

    service = module.get<LineService>(LineService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildLoginUrl', () => {
    it('LINE認証URLを組み立てる', () => {
      process.env.LINE_CHANNEL_ID = 'test-channel-id';
      process.env.LINE_REDIRECT_URI =
        'http://localhost:3000/api/v1/auth/line/callback';

      const url = service.buildLoginUrl('yamada@example.com');

      expect(url).toContain('https://access.line.me/oauth2/v2.1/authorize');
      expect(url).toContain('client_id=test-channel-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv1%2Fauth%2Fline%2Fcallback',
      );
      expect(url).toContain('state=yamada%40example.com');
      expect(url).toContain('bot_prompt=aggressive');
    });

    it('公式アカウント基本IDから友だち追加URLを組み立てる', () => {
      process.env.LINE_OA_BASIC_ID = 'example_oa';
      delete process.env.LINE_ADD_FRIEND_URL;
      expect(service.addFriendUrl).toBe('https://line.me/R/ti/p/@example_oa');
    });

    it('LINE_ADD_FRIEND_URLが優先される', () => {
      process.env.LINE_OA_BASIC_ID = 'example_oa';
      process.env.LINE_ADD_FRIEND_URL = 'https://lin.ee/short';
      expect(service.addFriendUrl).toBe('https://lin.ee/short');
    });

    it('未設定なら空文字', () => {
      delete process.env.LINE_OA_BASIC_ID;
      delete process.env.LINE_ADD_FRIEND_URL;
      expect(service.addFriendUrl).toBe('');
    });

    it('MessagingのBot情報から友だち追加URLを組み立てる', async () => {
      delete process.env.LINE_OA_BASIC_ID;
      delete process.env.LINE_ADD_FRIEND_URL;
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'access-token';

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ basicId: '@bot_basic' }),
      } as Response);

      await expect(service.resolveAddFriendUrl()).resolves.toBe(
        'https://line.me/R/ti/p/@bot_basic',
      );
    });

    it('redirectUriを上書きできる', () => {
      process.env.LINE_CHANNEL_ID = 'test-channel-id';
      const url = service.buildLoginUrl(
        'yamada@example.com',
        'https://custom.example.com/callback',
      );
      expect(url).toContain(
        'redirect_uri=https%3A%2F%2Fcustom.example.com%2Fcallback',
      );
    });

    it('applicationIdをstateに含める', () => {
      process.env.LINE_CHANNEL_ID = 'test-channel-id';
      const url = service.buildLoginUrl(
        'yamada@example.com',
        undefined,
        'http://localhost:3001/line-link/complete',
        'teacher-uuid-1',
      );
      const state = new URL(url).searchParams.get('state') ?? '';
      expect(service.parseOAuthState(state)).toEqual({
        email: 'yamada@example.com',
        returnUrl: 'http://localhost:3001/line-link/complete',
        applicationId: 'teacher-uuid-1',
      });
    });
  });

  describe('exchangeToken', () => {
    it('OAuth未設定時はBadRequestExceptionを投げる', async () => {
      delete process.env.LINE_CHANNEL_ID;
      delete process.env.LINE_CHANNEL_SECRET;

      await expect(service.exchangeToken('code123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('トークン交換に成功する', async () => {
      process.env.LINE_CHANNEL_ID = 'id';
      process.env.LINE_CHANNEL_SECRET = 'secret';
      process.env.LINE_REDIRECT_URI =
        'http://localhost:3000/api/v1/auth/line/callback';

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'token-abc' }),
      } as Response);

      const result = await service.exchangeToken('code123');
      expect(result.access_token).toBe('token-abc');
    });

    it('トークン交換失敗時はBadRequestExceptionを投げる', async () => {
      process.env.LINE_CHANNEL_ID = 'id';
      process.env.LINE_CHANNEL_SECRET = 'secret';

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
      } as Response);

      await expect(service.exchangeToken('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserProfile', () => {
    it('プロフィールを取得する', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          userId: 'U123',
          displayName: '山田 太郎',
        }),
      } as Response);

      const profile = await service.getUserProfile('token-abc');
      expect(profile).toEqual({
        userId: 'U123',
        displayName: '山田 太郎',
      });
    });
  });

  describe('getFriendshipStatus', () => {
    it('friendFlagを返す', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ friendFlag: true }),
      } as Response);

      await expect(service.getFriendshipStatus('token-abc')).resolves.toBe(
        true,
      );
    });

    it('取得失敗時はundefinedを返す', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
      } as Response);

      await expect(
        service.getFriendshipStatus('token-abc'),
      ).resolves.toBeUndefined();
    });
  });

  describe('pushMessage', () => {
    it('Messaging未設定時はスキップする', async () => {
      delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const fetchSpy = jest.spyOn(global, 'fetch');

      await service.pushMessage('U123', 'テスト');

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('Pushメッセージを送信する', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'access-token';
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      await service.pushMessage('U123', 'テストメッセージ');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        }),
      );
    });
  });

  describe('pushMessageToGroup', () => {
    it('グループIDへメッセージを送信する', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'access-token';
      process.env.LINE_GROUP_ID = 'C-group-id';
      const pushSpy = jest
        .spyOn(service, 'pushMessage')
        .mockResolvedValue(undefined);

      await service.pushMessageToGroup('グループ通知');

      expect(pushSpy).toHaveBeenCalledWith('C-group-id', 'グループ通知');
    });
  });
});
