import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

/**
 * 定期実行エンドポイント用シークレット検証。
 * CRON_SECRET が未設定の場合は拒否する（未設定のまま公開しない）。
 * リクエストヘッダー `x-cron-secret` と環境変数を照合する。
 */
@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Cronシークレットが未設定です');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-cron-secret');
    if (!provided) {
      throw new UnauthorizedException('Cronシークレットが無効です');
    }

    const providedBuffer = Buffer.from(provided, 'utf8');
    const secretBuffer = Buffer.from(secret, 'utf8');
    if (
      providedBuffer.length !== secretBuffer.length ||
      !timingSafeEqual(providedBuffer, secretBuffer)
    ) {
      throw new UnauthorizedException('Cronシークレットが無効です');
    }

    return true;
  }
}
