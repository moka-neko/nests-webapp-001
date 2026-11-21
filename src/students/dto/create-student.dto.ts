import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * 生徒の新規応募リクエスト（API #3: POST /api/v1/students/applications）
 *
 * Googleフォームの項目:
 *   response[0] 回答日時（サーバー生成）
 *   response[1] メールアドレス
 *   response[2] 氏名
 *   response[3] 電話番号
 *   response[4] 国籍
 *   response[5] 質問
 *   desiredLessonsPerWeek 受講希望回数（週あたり、追加項目）
 */
export class CreateStudentApplicationDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'メールアドレス',
    example: 'suzuki@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '氏名', example: '鈴木 花子' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '電話番号', example: '090-9876-5432' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '国籍', example: '日本' })
  nationality: string;

  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  @ApiProperty({
    description: '受講希望回数（週あたりの回数、1〜7）',
    example: 2,
    minimum: 1,
    maximum: 7,
  })
  desiredLessonsPerWeek: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '質問・相談内容',
    example: '週に何回授業を受けられますか？',
  })
  questions?: string;
}
