import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** ログイン時の TOTP 検証リクエスト */
export class MfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'POST /admin/login が返す短期 MFA トークン' })
  mfaToken: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  @ApiProperty({ example: '123456', description: 'Google Authenticator の6桁コード' })
  code: string;
}
