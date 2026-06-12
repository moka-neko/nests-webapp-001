import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** TOTP 有効化リクエスト（セットアップ後の初回検証） */
export class MfaEnableDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  @ApiProperty({ example: '123456', description: 'Google Authenticator の6桁コード' })
  code: string;
}
