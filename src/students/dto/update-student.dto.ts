import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * 生徒の基本情報更新リクエスト（API #11: PUT /api/v1/students/applications/{id}）
 *
 * email はキーとして使用するため更新対象外。
 */
export class UpdateStudentApplicationDto {
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

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '質問・相談内容',
    example: '週に何回授業を受けられますか？',
  })
  questions?: string;
}
