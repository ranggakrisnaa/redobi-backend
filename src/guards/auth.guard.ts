import { JwtPayloadType } from '@/api/auth/types/jwt-payload.type';
import { SessionRepository } from '@/api/session/session.repository';
import { Uuid } from '@/common/types/common.type';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken) {
      throw new UnauthorizedException('Token not found in header');
    }

    const payload = await this.verifyAccessToken(accessToken);
    try {
      console.log(payload.id);
      const session = await this.sessionRepository.findOneBy({
        userId: payload.id as Uuid,
      });

      if (!session || session.accessToken !== accessToken) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request['user'] = payload;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Invalid authentication');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('auth.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
