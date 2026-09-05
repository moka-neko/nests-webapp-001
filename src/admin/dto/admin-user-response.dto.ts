import { ApiProperty } from '@nestjs/swagger';
import { AdminProfileDto } from './admin-profile.dto';

/** 管理者ユーザー（一覧・追加レスポンス） */
export class AdminUserResponseDto extends AdminProfileDto {
  @ApiProperty({
    description: '作成日時',
    example: '2026-09-05T00:00:00.000Z',
  })
  createdAt: Date;
}
