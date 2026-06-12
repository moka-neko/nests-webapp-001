import { ApiProperty } from '@nestjs/swagger';

/** ログイン中の管理者プロフィール */
export class AdminProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Google Authenticator（TOTP）が有効か' })
  totpEnabled: boolean;
}
