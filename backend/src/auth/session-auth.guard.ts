import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationSessionEntity } from '../database/entities/application-session.entity';
import { ApplicationUserEntity } from '../database/entities/application-user.entity';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: ApplicationUserEntity;
  session: ApplicationSessionEntity;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Optional()
    private readonly authService?: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authService) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractSessionToken(request);
    if (!token) {
      throw new UnauthorizedException('Chưa xác thực: Yêu cầu thiếu phiên đăng nhập.');
    }

    const validation = await this.authService.validateSession(token);
    if (!validation) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ, đã hết hạn hoặc tài khoản đã bị khóa.',
      );
    }

    // Attach verified user and session to request
    request.user = validation.user;
    request.session = validation.session;

    return true;
  }

  private extractSessionToken(req: Request): string | null {
    // 1. Check req.cookies
    if (req.cookies && req.cookies['bei_session']) {
      return req.cookies['bei_session'];
    }

    // 2. Parse raw Cookie header if cookies object not populated
    const rawCookie = req.headers.cookie;
    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)bei_session=([^;]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    // 3. Fallback: Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 4. Fallback: custom header
    const tokenHeader = req.headers['x-session-token'];
    if (typeof tokenHeader === 'string' && tokenHeader.length > 0) {
      return tokenHeader;
    }

    return null;
  }
}
