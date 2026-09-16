import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { AuthService } from './auth.service.js';

class DevLoginDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  merchantId?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('dev-login')
  @ApiOperation({ summary: 'Development identity login' })
  devLogin(@Body() dto: DevLoginDto) {
    return this.authService.devLogin(dto.userId, dto.role, dto.merchantId);
  }

  @Public()
  @Post('wechat-mini-login')
  @ApiOperation({ summary: 'WeChat login placeholder' })
  wechatMiniLogin() {
    throw new BadRequestException(
      '微信登录未配置，请使用开发登录 seed-user-student / seed-user-merchant / seed-user-rider',
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user' })
  me(@CurrentUser() user: RequestContext) {
    return this.authService.me(user.userId, user.role, user.merchantId);
  }
}
