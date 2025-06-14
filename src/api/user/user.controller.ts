import { JwtPayloadType } from '@/api/auth/types/jwt-payload.type';
import { RequestPasswordDto } from '@/api/user/dto/request-password.dto';
import { UpdateEmailDto } from '@/api/user/dto/update-email.dto';
import { UpdatePasswordDto } from '@/api/user/dto/update-password.dto';
import { UpdateUserDto } from '@/api/user/dto/update.dto';
import { VerifyOtpDto } from '@/api/user/dto/verify-otp.dto';
import { IUser } from '@/database/interface-model/user-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { AuthGuard } from '@/guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MulterService } from '../../multer/multer.service';
import { UserService } from './user.service';

@ApiTags('users')
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiAuth()
  @Get()
  async Detail(@CurrentUser() userToken: JwtPayloadType) {
    return await this.userService.Detail(userToken.id);
  }

  @ApiAuth()
  @Post('update-auth')
  async RequestUpdateEmailAndPassword(@Body() req: RequestPasswordDto) {
    return await this.userService.RequestUpdateEmailAndPassword(req);
  }

  @ApiAuth()
  @Post('verify')
  async VerifyOtp(@Body() req: VerifyOtpDto): Promise<Partial<IUser>> {
    return await this.userService.VerifyOtp(req);
  }

  @ApiAuth()
  @Put('update')
  @UseInterceptors(
    FileInterceptor('file', new MulterService().multerImageOptions),
  )
  async Update(
    @Body() req: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userToken: JwtPayloadType,
  ) {
    return await this.userService.Update(req, userToken.id, file);
  }

  @ApiAuth()
  @Post('confirm-update-password')
  async UpdatePassword(
    @Body() req: UpdatePasswordDto,
    @CurrentUser() userToken: JwtPayloadType,
  ) {
    return await this.userService.UpdatePassword(req, userToken.id);
  }

  @ApiAuth()
  @Post('confirm-update-email')
  async UpdateEmail(
    @Body() req: UpdateEmailDto,
    @CurrentUser() userToken: JwtPayloadType,
  ) {
    return await this.userService.UpdateEmail(req, userToken.id);
  }
}
