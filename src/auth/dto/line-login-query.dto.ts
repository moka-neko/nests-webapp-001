import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/** LINEログイン開始リクエストのクエリパラメータ（API #4: GET /api/v1/auth/line/login） */
export class LineLoginQueryDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '紐づけ対象の応募者メールアドレス（state パラメータに格納）',
    example: 'yamada@example.com',
  })
  email: string;

  @IsOptional()
  @IsIn(['teacher', 'student'])
  @ApiPropertyOptional({
    description: '対象ユーザー種別',
    example: 'teacher',
    enum: ['teacher', 'student'],
  })
  userType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'LINE認証完了後のコールバックURL（省略時はデフォルトを使用）',
    example: 'https://example.com/auth/line/callback',
  })
  redirectUri?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'LINE連携完了後にリダイレクトするフロントエンド URL（省略時は JSON レスポンス）',
    example: 'http://localhost:3001/line-link/complete',
  })
  returnUrl?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: '紐づけ対象の先生応募 ID（指定時は当該レコードを更新）',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  applicationId?: string;
}
