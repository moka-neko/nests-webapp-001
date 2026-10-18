import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CronSecretGuard } from './cron-secret.guard';

describe('CronSecretGuard', () => {
  const guard = new CronSecretGuard();

  function contextWith(header?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) =>
            name === 'x-cron-secret' ? header : undefined,
        }),
      }),
    } as ExecutionContext;
  }

  const original = process.env.CRON_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = original;
    }
  });

  it('シークレット未設定では拒否する', () => {
    delete process.env.CRON_SECRET;
    expect(() => guard.canActivate(contextWith('secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('ヘッダーが一致すれば許可する', () => {
    process.env.CRON_SECRET = 'weekly-secret';
    expect(guard.canActivate(contextWith('weekly-secret'))).toBe(true);
  });

  it('ヘッダーが不一致なら拒否する', () => {
    process.env.CRON_SECRET = 'weekly-secret';
    expect(() => guard.canActivate(contextWith('wrong'))).toThrow(
      UnauthorizedException,
    );
  });
});
