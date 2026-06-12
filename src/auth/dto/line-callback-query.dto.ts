import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** LINEコールバックリクエストのクエリパラメータ（API #5: GET /api/v1/auth/line/callback） */
export class LineCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'LINEが発行する認可コード',
    example: 'abc123xyz',
  })
  code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'CSRF対策のステートトークン（メールアドレスを格納）',
    example: 'yamada%40example.com',
  })
  state: string;
}
