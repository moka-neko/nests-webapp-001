import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
}
