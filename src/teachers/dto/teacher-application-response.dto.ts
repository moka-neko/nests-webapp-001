import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeacherApplicationStatus } from '../enums/teacher-application-status.enum';

/**
 * 先生応募データのレスポンス
 *
 * スプレッドシート「先生応募一覧」の列構成に対応:
 *   Col1  submittedAt     回答日時
 *   Col2  email           メールアドレス
 *   Col3  nameKanji       お名前（漢字）
 *   Col4  nameKatakana    お名前（カタカナ）
 *   Col5  age             年齢
 *   Col6  workLocation    勤務場所
 *   Col7  questions       質問事項
 *   Col8  resumeUrl       履歴書URL
 *   Col9  status          選考ステータス（ドロップダウン）
 *   Col10 lineDisplayName LINE表示名（LINEログイン後に追記）
 *   Col11 lineUserId      LINE userId（LINEログイン後に追記）
 */
export class TeacherApplicationResponseDto {
  @ApiProperty({ description: '応募ID（UUID）', example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'yamada@example.com',
  })
  email: string;

  @ApiProperty({ description: 'お名前（漢字）', example: '山田 太郎' })
  nameKanji: string;

  @ApiProperty({ description: 'お名前（カタカナ）', example: 'ヤマダ タロウ' })
  nameKatakana: string;

  @ApiProperty({ description: '年齢', example: 25 })
  age: number;

  @ApiProperty({ description: '勤務希望場所', example: '東京都渋谷区' })
  workLocation: string;

  @ApiProperty({
    description: '履歴書URL',
    example: 'https://drive.google.com/file/d/xxxxx',
  })
  resumeUrl: string;

  @ApiPropertyOptional({
    type: 'string',
    description: '質問事項',
    example: '交通費支給はありますか？',
    nullable: true,
  })
  questions: string | null;

  @ApiProperty({
    description: '選考ステータス',
    enum: TeacherApplicationStatus,
    example: TeacherApplicationStatus.PENDING,
  })
  status: TeacherApplicationStatus;

  @ApiPropertyOptional({
    type: 'string',
    description: 'LINE表示名（LINEログイン連携後に設定）',
    example: '山田 太郎',
    nullable: true,
  })
  lineDisplayName: string | null;

  @ApiPropertyOptional({
    type: 'string',
    description: 'LINE userId（LINEログイン連携後に設定）',
    example: 'Uxxxxxxxxxxxxxxxxx',
    nullable: true,
  })
  lineUserId: string | null;

  @ApiPropertyOptional({
    type: 'string',
    description: '面接URL（TimeRex予約完了後に設定）',
    example: 'https://meet.google.com/abc-defg-hij',
    nullable: true,
  })
  meetingUrl: string | null;

  @ApiProperty({
    description: '応募日時（Googleフォーム回答日時）',
    example: '2026-06-01T10:00:00.000Z',
  })
  submittedAt: Date;

  @ApiProperty({
    description: '最終更新日時',
    example: '2026-06-05T12:00:00.000Z',
  })
  updatedAt: Date;
}
