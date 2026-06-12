import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { AdminProfileDto } from './dto/admin-profile.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';
import { MfaEnableDto } from './dto/mfa-enable.dto';
import { MfaSetupResponseDto } from './dto/mfa-setup-response.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import type { AuthenticatedAdmin } from './interfaces/jwt-payload.interface';

@ApiTags('admin')
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '管理者ログイン',
    description:
      'メールとパスワードで認証する。TOTP 有効時は mfaToken を返し、POST /admin/mfa/verify で JWT を取得する。',
  })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, description: '認証失敗' })
  login(@Body() dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminService.login(dto);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'TOTP 検証（ログイン第2段階）',
    description: 'Google Authenticator の6桁コードで JWT を発行する',
  })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, description: '認証失敗' })
  verifyMfa(@Body() dto: MfaVerifyDto): Promise<AdminLoginResponseDto> {
    return this.adminService.verifyMfa(dto);
  }

  @Post('mfa/setup')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'TOTP セットアップ',
    description:
      'Google Authenticator 用の QR コードを生成する。続けて POST /admin/mfa/enable で有効化する。',
  })
  @ApiResponse({ status: 201, type: MfaSetupResponseDto })
  setupMfa(
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<MfaSetupResponseDto> {
    return this.adminService.setupMfa(admin.id);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'TOTP 有効化',
    description: 'セットアップ後の6桁コードで TOTP を有効化する',
  })
  @ApiResponse({ status: 200, type: AdminProfileDto })
  enableMfa(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: MfaEnableDto,
  ): Promise<AdminProfileDto> {
    return this.adminService.enableMfa(admin.id, dto.code);
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'TOTP 無効化',
    description: 'パスワードと6桁コードで TOTP を無効化する',
  })
  @ApiResponse({ status: 200, type: AdminProfileDto })
  disableMfa(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: MfaDisableDto,
  ): Promise<AdminProfileDto> {
    return this.adminService.disableMfa(admin.id, dto);
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'ログイン中の管理者情報取得' })
  @ApiResponse({ status: 200, type: AdminProfileDto })
  @ApiResponse({ status: 401, description: '未認証' })
  me(@CurrentAdmin() admin: AuthenticatedAdmin): Promise<AdminProfileDto> {
    return this.adminService.getProfile(admin);
  }
}
