import { AuthService } from '@/api/auth/auth.service';
import { SessionRepository } from '@/api/session/session.repository';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private sessionRepository: SessionRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const accessToken = this.extractTokenFromHeader(request);
      const checkHasToken = await this.sessionRepository.findOneBy({
        hashToken: accessToken,
      });

      if (!accessToken && accessToken !== checkHasToken.hashToken) {
        throw new UnauthorizedException();
      }

      request['user'] = await this.authService.verifyAccessToken(accessToken);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
