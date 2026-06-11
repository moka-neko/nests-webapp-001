import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 生徒応募データのレスポンス
 *
 * Googleフォーム「生徒募集」の項目に対応:
 *   submittedAt  回答日時
 *   email        メールアドレス
 *   name         氏名
 *   phoneNumber  電話番号
 *   nationality  国籍
 *   questions    質問
 */
export class StudentApplicationResponseDto {
  @ApiProperty({ description: '応募ID（UUID）', example: 'b2c3d4e5-...' })
  id: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'suzuki@example.com',
  })
  email: string;

  @ApiProperty({ description: '氏名', example: '鈴木 花子' })
  name: string;

  @ApiProperty({ description: '電話番号', example: '090-9876-5432' })
  phoneNumber: string;

  @ApiProperty({ description: '国籍', example: '日本' })
  nationality: string;

  @ApiPropertyOptional({
    type: 'string',
    description: '質問・相談内容',
    example: '週に何回授業を受けられますか？',
    nullable: true,
  })
  questions: string | null;

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
