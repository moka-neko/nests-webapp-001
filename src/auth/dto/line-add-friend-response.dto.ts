import { ApiProperty } from '@nestjs/swagger';

export class LineAddFriendResponseDto {
  @ApiProperty({
    description: '公式アカウント友だち追加 URL。未設定時は空文字',
    example: 'https://line.me/R/ti/p/@example',
  })
  addFriendUrl: string;
}
