import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** TOTP 無効化リクエスト */
export class MfaDisableDto {
  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'password123' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  @ApiProperty({ example: '123456' })
  code: string;
}
