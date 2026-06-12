import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { AdminProfileDto } from './dto/admin-profile.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';
import { MfaSetupResponseDto } from './dto/mfa-setup-response.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import {
  AuthenticatedAdmin,
  JwtPayload,
} from './interfaces/jwt-payload.interface';
import { TotpService } from './totp.service';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly totpService: TotpService,
  ) {}

  /** 環境変数から初期管理者を作成する */
  async onModuleInit(): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME ?? '管理者';

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL / ADMIN_PASSWORD が未設定のため、初期管理者は作成されません',
      );
      return;
    }

    const existing = await this.prisma.adminUser.findUnique({
      where: { email },
    });
    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.adminUser.create({
      data: { email, passwordHash, name },
    });
    this.logger.log(`初期管理者を作成しました: ${email}`);
  }

  async login(dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const admin = await this.validatePassword(dto.email, dto.password);

    if (admin.totpEnabled) {
      const mfaExpiresInSeconds = Number(
        process.env.MFA_TOKEN_EXPIRES_IN_SECONDS ?? 300,
      );
      const mfaToken = await this.jwtService.signAsync(
        {
          sub: admin.id,
          email: admin.email,
          purpose: 'mfa',
        } satisfies JwtPayload,
        { expiresIn: mfaExpiresInSeconds },
      );

      return {
        mfaRequired: true,
        mfaToken,
        tokenType: 'Bearer',
        expiresIn: `${mfaExpiresInSeconds}s`,
      };
    }

    return this.issueAccessToken(admin.id, admin.email);
  }

  async verifyMfa(dto: MfaVerifyDto): Promise<AdminLoginResponseDto> {
    const payload = await this.verifyMfaToken(dto.mfaToken);
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!admin?.totpEnabled || !admin.totpSecret) {
      throw new UnauthorizedException('TOTP が有効化されていません');
    }

    const secret = this.totpService.decryptSecret(admin.totpSecret);
    const isValid = await this.totpService.verifyCode(dto.code, secret);
    if (!isValid) {
      throw new UnauthorizedException('認証コードが正しくありません');
    }

    return this.issueAccessToken(admin.id, admin.email);
  }

  async setupMfa(adminId: string): Promise<MfaSetupResponseDto> {
    const admin = await this.findAdminOrFail(adminId);

    if (admin.totpEnabled) {
      throw new ConflictException('TOTP は既に有効化されています');
    }

    const secret = this.totpService.generateSecret();
    const encryptedSecret = this.totpService.encryptSecret(secret);

    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: false,
      },
    });

    const otpAuthUrl = this.totpService.generateOtpAuthUrl(admin.email, secret);
    const qrCodeDataUrl =
      await this.totpService.generateQrCodeDataUrl(otpAuthUrl);

    return { otpAuthUrl, qrCodeDataUrl };
  }

  async enableMfa(adminId: string, code: string): Promise<AdminProfileDto> {
    const admin = await this.findAdminOrFail(adminId);

    if (admin.totpEnabled) {
      throw new ConflictException('TOTP は既に有効化されています');
    }

    if (!admin.totpSecret) {
      throw new BadRequestException(
        '先に POST /api/v1/admin/mfa/setup を実行してください',
      );
    }

    const secret = this.totpService.decryptSecret(admin.totpSecret);
    const isValid = await this.totpService.verifyCode(code, secret);
    if (!isValid) {
      throw new UnauthorizedException('認証コードが正しくありません');
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { totpEnabled: true },
    });

    return this.toProfile(updated);
  }

  async disableMfa(
    adminId: string,
    dto: MfaDisableDto,
  ): Promise<AdminProfileDto> {
    const admin = await this.findAdminOrFail(adminId);

    if (!admin.totpEnabled || !admin.totpSecret) {
      throw new BadRequestException('TOTP は有効化されていません');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('パスワードが正しくありません');
    }

    const secret = this.totpService.decryptSecret(admin.totpSecret);
    const isCodeValid = await this.totpService.verifyCode(dto.code, secret);
    if (!isCodeValid) {
      throw new UnauthorizedException('認証コードが正しくありません');
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        totpEnabled: false,
        totpSecret: null,
      },
    });

    return this.toProfile(updated);
  }

  getProfile(admin: AuthenticatedAdmin): Promise<AdminProfileDto> {
    return this.findAdminOrFail(admin.id).then((record) =>
      this.toProfile(record),
    );
  }

  private async validatePassword(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが正しくありません',
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが正しくありません',
      );
    }

    return admin;
  }

  private async verifyMfaToken(mfaToken: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(mfaToken);
      if (payload.purpose !== 'mfa') {
        throw new UnauthorizedException('MFA トークンが無効です');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('MFA トークンが無効または期限切れです');
    }
  }

  private async issueAccessToken(
    adminId: string,
    email: string,
  ): Promise<AdminLoginResponseDto> {
    const expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 28800);
    const accessToken = await this.jwtService.signAsync({
      sub: adminId,
      email,
      purpose: 'access',
    } satisfies JwtPayload);

    return {
      mfaRequired: false,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: `${expiresInSeconds}s`,
    };
  }

  private async findAdminOrFail(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new UnauthorizedException('管理者が見つかりません');
    }
    return admin;
  }

  private toProfile(admin: {
    id: string;
    email: string;
    name: string;
    totpEnabled: boolean;
  }): AdminProfileDto {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      totpEnabled: admin.totpEnabled,
    };
  }
}
