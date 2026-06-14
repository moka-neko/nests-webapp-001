import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LineService } from '../line/line.service';
import { PrismaService } from '../prisma/prisma.service';
import { LineCallbackQueryDto } from './dto/line-callback-query.dto';
import { LineLoginQueryDto } from './dto/line-login-query.dto';
import { LineCallbackResult } from './interfaces/line-callback-result.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly lineService: LineService,
    private readonly prisma: PrismaService,
  ) {}

  /** API #4: LINEログイン認証URLを生成して返す */
  getLineLoginUrl(query: LineLoginQueryDto): { url: string } {
    const redirectUri = query.redirectUri ?? this.lineService.defaultRedirectUri;
    const url = this.lineService.buildLoginUrl(
      query.email,
      redirectUri,
      query.returnUrl,
    );
    return { url };
  }

  /** API #5: LINE認可コードを受け取り、LINE APIと通信してLINE IDを取得・保存する */
  async handleLineCallback(
    query: LineCallbackQueryDto,
  ): Promise<LineCallbackResult> {
    const { email, returnUrl } = this.lineService.parseOAuthState(query.state);
    const redirectUri = this.lineService.defaultRedirectUri;

    const token = await this.lineService.exchangeToken(
      query.code,
      redirectUri || undefined,
    );
    const profile = await this.lineService.getUserProfile(token.access_token);

    const teacher = await this.prisma.teacherApplication.findFirst({
      where: { email },
    });

    if (!teacher) {
      this.logger.warn(`LINE callback: teacher not found for email=${email}`);
      throw new NotFoundException('対象ユーザーが存在しない');
    }

    const updated = await this.prisma.teacherApplication.update({
      where: { id: teacher.id },
      data: {
        lineUserId: profile.userId,
        lineDisplayName: profile.displayName,
      },
    });

    return {
      message: 'LINE連携が完了しました。',
      userId: updated.id,
      lineUserId: profile.userId,
      lineDisplayName: profile.displayName,
      returnUrl,
    };
  }

  parseReturnUrlFromState(state: string): string | undefined {
    return this.lineService.parseOAuthState(state).returnUrl;
  }
}
