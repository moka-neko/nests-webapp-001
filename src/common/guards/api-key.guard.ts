import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * 応募受付 API 用 API キーガード。
 * APPLICATION_API_KEY が未設定の場合はスキップ（開発環境向け）。
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const apiKey = process.env.APPLICATION_API_KEY;
    if (!apiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header('x-api-key');

    if (!providedKey || providedKey !== apiKey) {
      throw new UnauthorizedException('APIキーが無効です');
    }

    return true;
  }
}
