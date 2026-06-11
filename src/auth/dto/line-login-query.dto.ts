import { ApiPropertyOptional } from '@nestjs/swagger';

/** LINEログイン開始リクエストのクエリパラメータ（API #4: GET /api/v1/auth/line/login） */
export class LineLoginQueryDto {
  @ApiPropertyOptional({
    description: '対象ユーザー種別',
    example: 'teacher',
    enum: ['teacher', 'student'],
  })
  userType?: string;

  @ApiPropertyOptional({
    description: 'LINE認証完了後のコールバックURL（省略時はデフォルトを使用）',
    example: 'https://example.com/auth/line/callback',
  })
  redirectUri?: string;
}
