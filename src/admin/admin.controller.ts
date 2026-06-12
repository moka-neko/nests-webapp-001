import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
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
  @ApiOperation({ summary: '管理者ログイン', description: 'JWT アクセストークンを発行する' })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, description: '認証失敗' })
  login(@Body() dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ログイン中の管理者情報取得' })
  @ApiResponse({ status: 200, type: AdminProfileDto })
  @ApiResponse({ status: 401, description: '未認証' })
  me(@CurrentAdmin() admin: AuthenticatedAdmin): AdminProfileDto {
    return this.adminService.getProfile(admin);
  }
}
