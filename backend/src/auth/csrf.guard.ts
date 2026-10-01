import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const rawOrigins = this.configService.get<string>('AUTH_ALLOWED_WEB_ORIGINS') || process.env.AUTH_ALLOWED_WEB_ORIGINS;
    if (rawOrigins) {
      this.allowedOrigins = rawOrigins.split(',').map((o) => o.trim().replace(/\/+$/, ''));
    } else {
      this.allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ];
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    // Safe read methods don't require CSRF checks
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // 1. Enforce custom header X-BEI-Request: 1
    const customHeader = req.headers['x-bei-request'];
    if (!customHeader || customHeader !== '1') {
      throw new ForbiddenException(
        'Yêu cầu bị từ chối: Thiếu hoặc sai tiêu đề bảo mật X-BEI-Request.',
      );
    }

    // 2. Enforce strict Origin check
    const origin = req.headers['origin'];
    if (!origin) {
      throw new ForbiddenException('Yêu cầu bị từ chối: Thiếu tiêu đề Origin hợp lệ.');
    }

    const normalizedOrigin = (Array.isArray(origin) ? origin[0] : origin).trim().replace(/\/+$/, '');
    if (!this.allowedOrigins.includes(normalizedOrigin)) {
      throw new ForbiddenException(`Yêu cầu bị từ chối: Origin '${normalizedOrigin}' không nằm trong danh sách cho phép.`);
    }

    // 3. If request body is present, enforce Content-Type: application/json
    if (req.body && Object.keys(req.body).length > 0) {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        throw new ForbiddenException(
          'Yêu cầu bị từ chối: Content-Type bắt buộc phải là application/json.',
        );
      }
    }

    return true;
  }
}
