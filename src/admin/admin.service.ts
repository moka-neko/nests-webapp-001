import {
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
import { AuthenticatedAdmin } from './interfaces/jwt-payload.interface';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    const isValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    const expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 28800);
    const accessToken = await this.jwtService.signAsync({
      sub: admin.id,
      email: admin.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: `${expiresInSeconds}s`,
    };
  }

  getProfile(admin: AuthenticatedAdmin): AdminProfileDto {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
  }
}
