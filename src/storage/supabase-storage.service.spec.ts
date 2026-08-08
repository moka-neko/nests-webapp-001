import { ServiceUnavailableException } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

describe('SupabaseStorageService', () => {
  let service: SupabaseStorageService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    service = new SupabaseStorageService();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    delete process.env.SUPABASE_STORAGE_BUCKET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('未設定の場合は isConfigured が false を返す', () => {
    delete process.env.SUPABASE_URL;
    expect(service.isConfigured()).toBe(false);
  });

  it('未設定の場合は 503 を投げる', async () => {
    delete process.env.SUPABASE_URL;
    await expect(
      service.uploadTeacherPhoto({
        buffer: Buffer.from('x'),
        mimetype: 'image/jpeg',
        originalname: 'a.jpg',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('Storage REST API にアップロードし公開URLを返す', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    const url = await service.uploadTeacherPhoto({
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/png',
      originalname: 'photo.png',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(calledUrl).toMatch(
      /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/teacher-photos\/photos\/[0-9a-f-]+\.png$/,
    );
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer service-role-key');
    expect(init.headers['Content-Type']).toBe('image/png');
    expect(url).toMatch(
      /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/teacher-photos\/photos\/[0-9a-f-]+\.png$/,
    );
  });

  it('アップロード失敗時は 503 を投げる', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('error', { status: 400 }));

    await expect(
      service.uploadTeacherPhoto({
        buffer: Buffer.from('x'),
        mimetype: 'image/jpeg',
        originalname: 'a.jpg',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
