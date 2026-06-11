import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LineCallbackQueryDto } from './dto/line-callback-query.dto';
import { LineCallbackResponseDto } from './dto/line-callback-response.dto';
import { LineLoginQueryDto } from './dto/line-login-query.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * API #4: GET /api/v1/auth/line/login
   * LINEログインの認証画面URLを組み立て、LINE公式の認可画面へリダイレクトさせる。
   */
  @Get('line/login')
  @Redirect('', 302)
  @ApiOperation({
    summary: 'LINEログイン開始',
    description:
      'LINEログインの認証画面URLを組み立て、対象のユーザー（先生など）をLINE公式の認可画面へリダイレクトさせる。',
  })
  @ApiResponse({ status: 302, description: 'LINE認証画面へリダイレクト' })
  @ApiResponse({ status: 400, description: 'リクエストパラメータが不正' })
  lineLogin(@Query() query: LineLoginQueryDto): { url: string } {
    return this.authService.getLineLoginUrl(query);
  }

  /**
   * API #5: GET /api/v1/auth/line/callback
   * LINEでの許可完了後、認可コードを受け取りLINE APIと通信してLINE IDを取得。
   * データベースのユーザー情報と紐づけて保存する。
   */
  @Get('line/callback')
  @ApiOperation({
    summary: 'LINEコールバック処理',
    description:
      'LINEでの許可完了後、認可コード（code）を受け取る。LINE APIと通信してLINE IDを取得し、データベースのユーザー情報と紐づけて保存する。',
  })
  @ApiResponse({
    status: 200,
    description: 'LINE連携に成功',
    type: LineCallbackResponseDto,
  })
  @ApiResponse({ status: 400, description: '認可コードが不正または期限切れ' })
  @ApiResponse({ status: 404, description: '対象ユーザーが存在しない' })
  lineCallback(@Query() query: LineCallbackQueryDto): LineCallbackResponseDto {
    return this.authService.handleLineCallback(query);
  }
}
