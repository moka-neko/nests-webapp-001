import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, toLineLinkErrorUrl } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    getLineLoginUrl: jest.fn(),
    handleLineCallback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('toLineLinkErrorUrl', () => {
    it('静的エクスポートの complete.html を error.html に差し替える', () => {
      expect(
        toLineLinkErrorUrl(
          'https://example.com/line-link/complete.html',
        ),
      ).toBe('https://example.com/line-link/error.html');
    });

    it('パス末尾の complete を error に差し替える', () => {
      expect(
        toLineLinkErrorUrl('https://example.com/line-link/complete'),
      ).toBe('https://example.com/line-link/error');
    });
  });
});
