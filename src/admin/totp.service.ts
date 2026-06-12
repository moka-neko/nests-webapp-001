import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';

const APP_NAME = '塾応募管理API';
const ENCRYPTION_SALT = 'admin-totp-v1';

@Injectable()
export class TotpService {
  private getEncryptionKey(): Buffer {
    const secret =
      process.env.MFA_ENCRYPTION_KEY ??
      process.env.JWT_SECRET ??
      'dev-mfa-encryption-key';
    return scryptSync(secret, ENCRYPTION_SALT, 32);
  }

  generateSecret(): string {
    return generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string): string {
    return generateURI({
      issuer: APP_NAME,
      label: email,
      secret,
    });
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl);
  }

  async verifyCode(code: string, secret: string): Promise<boolean> {
    const result = await verify({ secret, token: code });
    return result.valid;
  }

  encryptSecret(secret: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decryptSecret(encrypted: string): string {
    const key = this.getEncryptionKey();
    const data = Buffer.from(encrypted, 'base64');
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
