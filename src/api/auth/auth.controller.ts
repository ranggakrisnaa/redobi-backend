import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { VerifyLoginReqDto } from './dto/verify-login.req.dto';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiPublic({
    type: LoginResDto,
    summary: 'Sign in',
  })
  @Post('/login')
  async signIn(@Body() reqLoginDto: LoginReqDto) {
    return await this.authService.signIn(reqLoginDto);
  }

  @ApiPublic({
    type: VerifyLoginReqDto,
    summary: 'Verify Sign in',
  })
  @Post('/verify-login')
  async verifySignIn(@Body() reqVerifyLoginDto: VerifyLoginReqDto) {
    return await this.authService.verifySignIn(reqVerifyLoginDto);
  }

  @ApiAuth()
  @Post('logout')
  async logout() {
    return '';
  }

  @ApiPublic({
    type: RefreshResDto,
    summary: 'Refresh token',
  })
  @Post('refresh')
  async refresh() {
    return '';
  }

  @ApiPublic()
  @Post('forgot-password')
  async forgotPassword() {
    return 'forgot-password';
  }

  @ApiPublic()
  @Post('verify/forgot-password')
  async verifyForgotPassword() {
    return 'verify-forgot-password';
  }

  @ApiPublic()
  @Post('reset-password')
  async resetPassword() {
    return 'reset-password';
  }

  @ApiPublic()
  @Get('verify/email')
  async verifyEmail() {
    return 'verify-email';
  }

  @ApiPublic()
  @Post('verify/email/resend')
  async resendVerifyEmail() {
    return 'resend-verify-email';
  }
}
