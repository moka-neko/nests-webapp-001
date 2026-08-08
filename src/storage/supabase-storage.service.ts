import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

/** アップロード対象ファイル（multer のメモリストレージ形式） */
export interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Supabase Storage への画像アップロードを行うサービス。
 *
 * Storage REST API を直接呼び出すため、追加の SDK は不要。
 * 必要な環境変数:
 *   - SUPABASE_URL              https://<project-ref>.supabase.co
 *   - SUPABASE_SERVICE_ROLE_KEY サービスロールキー（サーバー専用・公開禁止）
 *   - SUPABASE_STORAGE_BUCKET   バケット名（省略時: teacher-photos）
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);

  private get supabaseUrl(): string | undefined {
    return process.env.SUPABASE_URL?.replace(/\/+$/, '');
  }

  private get serviceRoleKey(): string | undefined {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  private get bucket(): string {
    return process.env.SUPABASE_STORAGE_BUCKET ?? 'teacher-photos';
  }

  isConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.serviceRoleKey);
  }

  /**
   * 顔写真を Supabase Storage にアップロードし、公開 URL を返す。
   */
  async uploadTeacherPhoto(file: UploadableFile): Promise<string> {
    const supabaseUrl = this.supabaseUrl;
    const serviceRoleKey = this.serviceRoleKey;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new ServiceUnavailableException(
        '画像アップロードが未設定です（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください）',
      );
    }

    const extension = MIME_EXTENSIONS[file.mimetype] ?? 'bin';
    const objectPath = `photos/${randomUUID()}.${extension}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${this.bucket}/${objectPath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': file.mimetype,
        'x-upsert': 'false',
      },
      body: new Uint8Array(file.buffer),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(
        `Supabase Storage upload failed: ${response.status} ${body}`,
      );
      throw new ServiceUnavailableException(
        '画像のアップロードに失敗しました。時間をおいて再試行してください',
      );
    }

    return `${supabaseUrl}/storage/v1/object/public/${this.bucket}/${objectPath}`;
  }
}
