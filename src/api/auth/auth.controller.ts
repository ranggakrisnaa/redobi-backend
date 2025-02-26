import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
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
  async signIn(@Body() req: LoginReqDto) {
    return await this.authService.signIn(req);
  }

  @ApiPublic({
    type: VerifyLoginReqDto,
    summary: 'Verify Sign in',
  })
  @Post('/verify-login')
  async verifySignIn(@Body() req: VerifyLoginReqDto) {
    return await this.authService.verifySignIn(req);
  }

  @ApiAuth()
  @Post('logout')
  async logout() {
    return '';
  }
}
