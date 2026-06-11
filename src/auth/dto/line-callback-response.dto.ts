import { ApiProperty } from '@nestjs/swagger';

/** LINEコールバック処理結果のレスポンス（API #5） */
export class LineCallbackResponseDto {
  @ApiProperty({
    description: '処理結果メッセージ',
    example: 'LINE連携が完了しました。',
  })
  message: string;

  @ApiProperty({
    description: 'DBのユーザーID（UUID）',
    example: 'a1b2c3d4-...',
  })
  userId: string;

  @ApiProperty({
    description: '取得したLINEユーザーID',
    example: 'Uxxxxxxxxxxxxxxxxx',
  })
  lineUserId: string;

  @ApiProperty({ description: 'LINEの表示名', example: '山田 太郎' })
  lineDisplayName: string;
}
