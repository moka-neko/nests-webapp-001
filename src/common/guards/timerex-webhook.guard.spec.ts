import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TimerexWebhookGuard } from './timerex-webhook.guard';

describe('TimerexWebhookGuard', () => {
  const guard = new TimerexWebhookGuard();
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TIMEREX_WEBHOOK_SECRET;
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

  it('シークレット未設定時は常に許可する', () => {
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('正しいシークレットで許可する', () => {
    process.env.TIMEREX_WEBHOOK_SECRET = 'webhook-secret';
    const context = createContext({ 'x-webhook-secret': 'webhook-secret' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('シークレット不一致時はUnauthorizedException', () => {
    process.env.TIMEREX_WEBHOOK_SECRET = 'webhook-secret';
    const context = createContext({ 'x-webhook-secret': 'wrong' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
