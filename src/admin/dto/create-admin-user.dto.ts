import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 管理者ユーザー追加リクエスト */
export class CreateAdminUserDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'admin2@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiProperty({ example: 'password123', minLength: 8 })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: '運営 花子' })
  name: string;
}
