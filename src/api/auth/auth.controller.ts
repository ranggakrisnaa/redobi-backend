import { RefreshReqDto } from '@/api/auth/dto/refresh.dto';
import { RegisterDto } from '@/api/auth/dto/register.dto';
import { ResendOtpDto } from '@/api/auth/dto/resend-otp.dto';
import { Token } from '@/common/types/common.type';
import { ISession } from '@/database/interface-model/session-entity.interface';
import { IUser } from '@/database/interface-model/user-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { AuthGuard } from '@/guards/auth.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login.dto';
import { VerifyLoginReqDto } from './dto/verify-login.dto';
import { JwtPayloadType } from './types/jwt-payload.type';
import { SignInResponse } from './types/sign-in-response.type';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiPublic({
    type: RegisterDto,
    summary: 'Sign up',
  })
  @Post('register')
  async SignUp(
    @Body() req: RegisterDto,
  ): Promise<Record<string, Partial<IUser>>> {
    return await this.authService.SignUp(req);
  }

  @ApiPublic({
    type: LoginReqDto,
    summary: 'Sign in',
  })
  @Post('login')
  async SignIn(
    @Body() req: LoginReqDto,
  ): Promise<Record<string, SignInResponse>> {
    return await this.authService.SignIn(req);
  }

  @ApiPublic({
    type: VerifyLoginReqDto,
    summary: 'Verify Sign in',
  })
  @Post('verify-login')
  async VerifySignIn(
    @Body() req: VerifyLoginReqDto,
  ): Promise<Record<string, Token>> {
    return await this.authService.VerifySignIn(req);
  }

  @ApiPublic({
    type: ResendOtpDto,
    summary: 'Verify Sign in',
  })
  @Post('/resend')
  async ResendOTP(@Body() req: ResendOtpDto): Promise<Record<string, any>> {
    return await this.authService.ResendOTP(req);
  }

  @ApiPublic({
    type: RefreshReqDto,
    summary: 'Refresh Token',
  })
  @Post('refresh')
  @UseGuards(AuthGuard)
  async RefreshToken(
    @Body() req: RefreshReqDto,
  ): Promise<Record<string, Token>> {
    return await this.authService.RefreshToken(req);
  }

  @ApiAuth()
  @Post('logout')
  @UseGuards(AuthGuard)
  async Logout(
    @CurrentUser() userToken: JwtPayloadType,
  ): Promise<Record<string, ISession>> {
    return await this.authService.Logout(userToken.id);
  }
}
