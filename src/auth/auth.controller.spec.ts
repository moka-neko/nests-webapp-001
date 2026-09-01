import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController, toLineLinkErrorUrl } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    getLineLoginUrl: jest.fn(),
    handleLineCallback: jest.fn(),
    parseOAuthState: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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

  describe('lineCallback', () => {
    const res = {
      redirect: jest.fn(),
      json: jest.fn(),
    } as unknown as Response;

    it('失敗時はエラー画面へリダイレクトしemailを付与する', async () => {
      authServiceMock.parseOAuthState.mockReturnValue({
        email: 'yamada@example.com',
        returnUrl: 'http://localhost:3001/line-link/complete',
      });
      authServiceMock.handleLineCallback.mockRejectedValue(
        new NotFoundException('対象ユーザーが存在しない'),
      );

      await controller.lineCallback(
        { code: 'auth-code', state: 'state' },
        res,
      );

      expect(res.redirect).toHaveBeenCalled();
      const redirected = (res.redirect as jest.Mock).mock.calls[0][0] as string;
      const url = new URL(redirected);
      expect(url.pathname).toBe('/line-link/error');
      expect(url.searchParams.get('email')).toBe('yamada@example.com');
      expect(url.searchParams.get('status')).toBe('404');
    });
  });
});
