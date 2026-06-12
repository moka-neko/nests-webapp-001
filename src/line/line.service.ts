import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

export interface LineTokenResponse {
  access_token: string;
}

export interface LineUserProfile {
  userId: string;
  displayName: string;
}

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);

  private get channelId(): string {
    return process.env.LINE_CHANNEL_ID ?? '';
  }

  private get channelSecret(): string {
    return process.env.LINE_CHANNEL_SECRET ?? '';
  }

  private get accessToken(): string {
    return process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
  }

  get groupId(): string {
    return process.env.LINE_GROUP_ID ?? '';
  }

  get defaultRedirectUri(): string {
    return process.env.LINE_REDIRECT_URI ?? '';
  }

  isOAuthConfigured(): boolean {
    return Boolean(this.channelId && this.channelSecret);
  }

  isMessagingConfigured(): boolean {
    return Boolean(this.accessToken);
  }

  /** LINE Login 認証 URL を組み立てる */
  buildLoginUrl(email: string, redirectUri?: string): string {
    const uri = redirectUri ?? this.defaultRedirectUri;
    const clientId = this.channelId || 'DUMMY';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: uri,
      scope: 'openid profile',
      state: email,
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  /** 認可コードをアクセストークンに交換する */
  async exchangeToken(
    code: string,
    redirectUri?: string,
  ): Promise<LineTokenResponse> {
    if (!this.isOAuthConfigured()) {
      throw new BadRequestException('LINE OAuth is not configured');
    }

    const uri = redirectUri ?? this.defaultRedirectUri;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: uri,
      client_id: this.channelId,
      client_secret: this.channelSecret,
    });

    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      this.logger.error(`LINE token exchange failed: ${response.status}`);
      throw new BadRequestException('認可コードが不正または期限切れ');
    }

    return (await response.json()) as LineTokenResponse;
  }

  /** アクセストークンから LINE プロフィールを取得する */
  async getUserProfile(accessToken: string): Promise<LineUserProfile> {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.logger.error(`LINE profile fetch failed: ${response.status}`);
      throw new BadRequestException('LINEプロフィールの取得に失敗しました');
    }

    const profile = (await response.json()) as {
      userId: string;
      displayName: string;
    };

    return {
      userId: profile.userId,
      displayName: profile.displayName,
    };
  }

  /** LINE Push メッセージを送信する */
  async pushMessage(to: string, message: string): Promise<void> {
    if (!this.isMessagingConfigured() || !to) {
      this.logger.log(`[LINE skipped] To: ${to}, Message: ${message}`);
      return;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!response.ok) {
      this.logger.error(`LINE push failed: ${response.status}`);
      throw new Error(`LINE push message failed: ${response.status}`);
    }
  }

  /** 運営グループへ Push メッセージを送信する */
  async pushMessageToGroup(message: string): Promise<void> {
    await this.pushMessage(this.groupId, message);
  }
}
