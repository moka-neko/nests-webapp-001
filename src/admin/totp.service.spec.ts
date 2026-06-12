import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, MFA_ENCRYPTION_KEY: 'test-encryption-key' };
    service = new TotpService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('シークレットを暗号化・復号できる', () => {
    const secret = service.generateSecret();
    const encrypted = service.encryptSecret(secret);
    const decrypted = service.decryptSecret(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('otpauth URL を生成できる', () => {
    const url = service.generateOtpAuthUrl(
      'admin@example.com',
      'JBSWY3DPEHPK3PXP',
    );
    expect(url).toContain('otpauth://');
  });

  it('QRコード data URL を生成できる', async () => {
    const url = service.generateOtpAuthUrl(
      'admin@example.com',
      'JBSWY3DPEHPK3PXP',
    );
    const dataUrl = await service.generateQrCodeDataUrl(url);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('正しい TOTP コードを検証できる', async () => {
    const isValid = await service.verifyCode('123456', 'JBSWY3DPEHPK3PXP');
    expect(isValid).toBe(true);
  });

  it('不正な TOTP コードを拒否する', async () => {
    const isValid = await service.verifyCode('000000', 'JBSWY3DPEHPK3PXP');
    expect(isValid).toBe(false);
  });
});
