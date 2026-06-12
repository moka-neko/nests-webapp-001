import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 管理者ログインレスポンス */
export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'TOTP 検証が必要かどうか',
    example: false,
  })
  mfaRequired: boolean;

  @ApiPropertyOptional({ description: 'JWT アクセストークン（mfaRequired=false の場合）' })
  accessToken?: string;

  @ApiPropertyOptional({
    description: 'MFA 検証用短期トークン（mfaRequired=true の場合）',
  })
  mfaToken?: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: '28800s' })
  expiresIn: string;
}
