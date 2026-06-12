import { ApiProperty } from '@nestjs/swagger';

/** 管理者ログインレスポンス */
export class AdminLoginResponseDto {
  @ApiProperty({ description: 'JWT アクセストークン' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: '28800s' })
  expiresIn: string;
}
