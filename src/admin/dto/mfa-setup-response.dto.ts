import { ApiProperty } from '@nestjs/swagger';

/** TOTP セットアップレスポンス */
export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'Google Authenticator に登録する otpauth:// URL',
    example: 'otpauth://totp/...',
  })
  otpAuthUrl: string;

  @ApiProperty({
    description: 'QRコード画像（data URL）',
    example: 'data:image/png;base64,...',
  })
  qrCodeDataUrl: string;
}
