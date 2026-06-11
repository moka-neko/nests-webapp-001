import { ApiProperty } from '@nestjs/swagger';

/** LINEコールバックリクエストのクエリパラメータ（API #5: GET /api/v1/auth/line/callback） */
export class LineCallbackQueryDto {
  @ApiProperty({
    description: 'LINEが発行する認可コード',
    example: 'abc123xyz',
  })
  code: string;

  @ApiProperty({
    description: 'CSRF対策のステートトークン',
    example: 'random-state-token',
  })
  state: string;
}
