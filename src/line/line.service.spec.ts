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
