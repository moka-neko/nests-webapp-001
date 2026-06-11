import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
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
}
