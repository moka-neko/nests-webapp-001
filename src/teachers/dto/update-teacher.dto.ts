import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 先生の基本情報更新リクエスト（API #8: PUT /api/v1/teachers/applications/{id}）
 *
 * email はスプレッドシートの主キー代わりに使用されているため更新対象外。
 * その他の応募フォーム記入項目を更新可能とする。
 */
export class UpdateTeacherApplicationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'お名前（漢字）', example: '山田 太郎' })
  nameKanji: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'お名前（カタカナ）', example: 'ヤマダ タロウ' })
  nameKatakana: string;

  @IsInt()
  @Min(18)
  @Max(80)
  @Type(() => Number)
  @ApiProperty({ description: '年齢', example: 25, minimum: 18, maximum: 80 })
  age: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '勤務希望場所', example: '東京都渋谷区' })
  workLocation: string;

  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({
    description: '履歴書URL（Google Drive等）',
    example: 'https://drive.google.com/file/d/xxxxx',
  })
  resumeUrl: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '質問事項',
    example: '交通費支給はありますか？',
  })
  questions?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(31)
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  @ApiPropertyOptional({
    description:
      '面接候補日（YYYY-MM-DD）。運営側の日程調整では応募時の表示期間外も指定できる',
    example: ['2026-10-19', '2026-10-21'],
    type: [String],
  })
  interviewCandidateDates?: string[];

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({
    type: 'string',
    nullable: true,
    description: '確定した面接日時（ISO8601）。null でクリアする',
    example: '2026-10-21T05:00:00.000Z',
  })
  interviewScheduledAt?: string | null;
}
