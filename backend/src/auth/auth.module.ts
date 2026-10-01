import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationUserEntity } from '../database/entities/application-user.entity';
import { ApplicationSessionEntity } from '../database/entities/application-session.entity';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PasswordHasherService } from './password-hasher.service';
import { RateLimiterService } from './rate-limiter.service';
import { SessionAuthGuard } from './session-auth.guard';
import { CsrfGuard } from './csrf.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationUserEntity, ApplicationSessionEntity]),
    AuthorizationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasherService,
    RateLimiterService,
    SessionAuthGuard,
    CsrfGuard,
  ],
  exports: [
    AuthService,
    PasswordHasherService,
    RateLimiterService,
    SessionAuthGuard,
    CsrfGuard,
  ],
})
export class AuthModule {}
