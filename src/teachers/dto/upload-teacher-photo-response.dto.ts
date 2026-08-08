import { ApiProperty } from '@nestjs/swagger';

/** 顔写真アップロードのレスポンス */
export class UploadTeacherPhotoResponseDto {
  @ApiProperty({
    description: 'アップロードした顔写真の公開URL（Supabase Storage）',
    example:
      'https://xxxx.supabase.co/storage/v1/object/public/teacher-photos/photos/xxxx.jpg',
  })
  photoUrl: string;
}
