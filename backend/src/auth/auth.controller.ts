import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CsrfGuard } from './csrf.guard';
import { SessionAuthGuard, AuthenticatedRequest } from './session-auth.guard';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Authenticate user with username and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'CSRF validation failed' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const priorToken = this.extractTokenFromRequest(req);
    const peerIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const result = await this.authService.login(dto, priorToken, peerIp);

    const isSecure = req.secure || process.env.NODE_ENV === 'production';

    // Set HttpOnly opaque session cookie
    res.cookie('bei_session', result.sessionSecret, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
      secure: isSecure,
    });

    // Return safe user DTO and rules (omit sessionSecret)
    return {
      user: result.user,
      abilityRules: result.abilityRules,
      sessionExpiresAt: result.sessionExpiresAt,
    };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get current authenticated user identity and CASL rules' })
  @ApiResponse({ status: 200, description: 'Current session user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized / expired session' })
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.authService.getCurrentUser(req.user, req.session);
  }

  @Post('logout')
  @UseGuards(CsrfGuard, SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Revoke current session and expire cookie' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.extractTokenFromRequest(req);
    await this.authService.logout(token);

    res.cookie('bei_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
      maxAge: 0,
    });

    return { success: true };
  }

  private extractTokenFromRequest(req: Request): string | null {
    if (req.cookies && req.cookies['bei_session']) {
      return req.cookies['bei_session'];
    }
    const rawCookie = req.headers.cookie;
    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)bei_session=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    const tokenHeader = req.headers['x-session-token'];
    if (typeof tokenHeader === 'string' && tokenHeader.length > 0) {
      return tokenHeader;
    }
    return null;
  }
}
