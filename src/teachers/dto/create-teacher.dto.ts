import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
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
 * 先生の新規応募リクエスト（API #1: POST /api/v1/teachers/applications）
 *
 * GASの onFormSubmit(e.values) に対応するフィールド:
 *   response[1] email
 *   response[2] nameKanji
 *   response[3] nameKatakana
 *   response[4] age
 *   response[5] workLocation
 *   response[6] 同意チェックボックス（送信条件のみ、値は不使用）
 *   response[7] resumeUrl
 *   response[8] questions
 */
export class CreateTeacherApplicationDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'メールアドレス（確認メールの送信先）',
    example: 'yamada@example.com',
  })
  email: string;

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
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  @ApiPropertyOptional({
    description:
      '面接候補日（任意）。入力日の14日後以降で最初の月曜日から1週間（月曜〜日曜）の YYYY-MM-DD。例: 2026-10-04 の入力では 2026-10-19〜2026-10-25',
    example: ['2026-10-19', '2026-10-21'],
    type: [String],
  })
  interviewCandidateDates?: string[];
}
