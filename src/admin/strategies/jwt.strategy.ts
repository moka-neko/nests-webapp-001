import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthenticatedAdmin,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedAdmin> {
    if (payload.purpose === 'mfa') {
      throw new UnauthorizedException('アクセストークンが必要です');
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
      throw new UnauthorizedException('管理者が見つかりません');
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
  }
}
