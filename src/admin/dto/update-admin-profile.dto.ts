import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** ログイン中の管理者プロフィール更新リクエスト */
export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiPropertyOptional({ example: '運営 花子', maxLength: 100 })
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'admin2@example.com', maxLength: 255 })
  email?: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: '現在のパスワード（本人確認）',
  })
  currentPassword: string;

  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiPropertyOptional({
    example: 'new-password123',
    minLength: 8,
    maxLength: 128,
    description: '新しいパスワード。省略時は変更しない',
  })
  newPassword?: string;
}
