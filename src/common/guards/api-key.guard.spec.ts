import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const guard = new ApiKeyGuard();
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.APPLICATION_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createContext = (headers: Record<string, string> = {}) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) => headers[name],
        }),
      }),
    } as ExecutionContext;
  };

  it('APIキー未設定時は常に許可する', () => {
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('正しいAPIキーで許可する', () => {
    process.env.APPLICATION_API_KEY = 'secret-key';
    const context = createContext({ 'x-api-key': 'secret-key' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('APIキー不一致時はUnauthorizedException', () => {
    process.env.APPLICATION_API_KEY = 'secret-key';
    const context = createContext({ 'x-api-key': 'wrong-key' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
