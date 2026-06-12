import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * TimeRex Webhook 用シークレット検証ガード。
 * TIMEREX_WEBHOOK_SECRET が未設定の場合はスキップ（開発環境向け）。
 * リクエストヘッダー `X-Webhook-Secret` と環境変数を照合する。
 */
@Injectable()
export class TimerexWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.TIMEREX_WEBHOOK_SECRET;
    if (!secret) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-webhook-secret');

    if (!provided) {
      throw new UnauthorizedException('Webhookシークレットが無効です');
    }

    const providedBuffer = Buffer.from(provided, 'utf8');
    const secretBuffer = Buffer.from(secret, 'utf8');

    if (
      providedBuffer.length !== secretBuffer.length ||
      !timingSafeEqual(providedBuffer, secretBuffer)
    ) {
      throw new UnauthorizedException('Webhookシークレットが無効です');
    }

    return true;
  }
}
