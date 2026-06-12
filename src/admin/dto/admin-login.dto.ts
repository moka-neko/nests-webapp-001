import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 管理者ログインリクエスト */
export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'password123', minLength: 8 })
  password: string;
}
