import { Injectable } from '@nestjs/common';
import { LineCallbackQueryDto } from './dto/line-callback-query.dto';
import { LineCallbackResponseDto } from './dto/line-callback-response.dto';
import { LineLoginQueryDto } from './dto/line-login-query.dto';

@Injectable()
export class AuthService {
  /**
   * API #4: LINEログイン認証URLを生成して返す（仮実装）
   * 実装時は LINE_CHANNEL_ID / LINE_REDIRECT_URI などの環境変数を使って
   * https://access.line.me/oauth2/v2.1/authorize?... を組み立てる。
   */
  getLineLoginUrl(_query: LineLoginQueryDto): { url: string } {
    return {
      url: 'https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=DUMMY',
    };
  }

  /**
   * API #5: LINE認可コードを受け取り、LINE APIと通信してLINE IDを取得・保存する（仮実装）
   * 実装時は LINE Channel Secret を用いてトークン取得・プロフィール取得を行う。
   */
  handleLineCallback(_query: LineCallbackQueryDto): LineCallbackResponseDto {
    return {
      message: 'LINE連携が完了しました。',
      userId: 'user-uuid-0001',
      lineUserId: 'Uxxxxxxxxxxxxxxxxx',
      lineDisplayName: '山田 太郎',
    };
  }
}
