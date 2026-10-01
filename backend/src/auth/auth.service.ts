import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { ApplicationUserEntity } from '../database/entities/application-user.entity';
import { ApplicationSessionEntity } from '../database/entities/application-session.entity';
import { PasswordHasherService } from './password-hasher.service';
import { RateLimiterService } from './rate-limiter.service';
import { CaslAbilityFactory } from '../authorization/casl-ability.factory';
import { LoginDto } from './dto/login.dto';

export interface CurrentUserDto {
  user: {
    id: string;
    username: string;
    role: 'viewer' | 'manager';
    displayRole: 'Viewer' | 'Manager';
  };
  abilityRules: any[];
  sessionExpiresAt: string;
}

export interface LoginResult extends CurrentUserDto {
  sessionSecret: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly sessionTtlMs = 8 * 60 * 60 * 1000; // 8 hours

  constructor(
    @InjectRepository(ApplicationUserEntity)
    private readonly userRepository: Repository<ApplicationUserEntity>,
    @InjectRepository(ApplicationSessionEntity)
    private readonly sessionRepository: Repository<ApplicationSessionEntity>,
    private readonly passwordHasher: PasswordHasherService,
    private readonly rateLimiter: RateLimiterService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async login(
    dto: LoginDto,
    priorSessionToken?: string | null,
    peerIp: string = '127.0.0.1',
  ): Promise<LoginResult> {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const rateLimitKey = `${normalizedUsername}:${peerIp}`;

    // 1. Check rate limit
    this.rateLimiter.checkLoginAttempt(rateLimitKey);

    // 2. Fetch user with password_hash explicitly selected
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :username', { username: normalizedUsername })
      .getOne();

    if (!user || !user.isActive) {
      this.rateLimiter.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    // 3. Verify password within bounded concurrency slot
    const isPasswordValid = await this.rateLimiter.acquireHashSlot(() =>
      this.passwordHasher.verify(dto.password, user.passwordHash),
    );

    if (!isPasswordValid) {
      this.rateLimiter.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    // Login successful: reset rate limiter for this user/ip
    this.rateLimiter.resetAttempts(rateLimitKey);

    // 4. If prior valid session was provided, revoke it transactionally
    if (priorSessionToken) {
      const priorHash = crypto.createHash('sha256').update(priorSessionToken).digest('hex');
      await this.sessionRepository.update(
        { tokenHash: priorHash },
        { revokedAt: new Date() },
      );
    }

    // 5. Generate random opaque session secret (32 random bytes -> 64 hex characters)
    const sessionSecret = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionSecret).digest('hex');
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    const newSession = this.sessionRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.sessionRepository.save(newSession);

    // 6. Generate ability rules
    const ability = this.caslAbilityFactory.createForUser(user);
    const abilityRules = this.caslAbilityFactory.getSanitizedRules(ability);

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayRole: user.role === 'manager' ? 'Manager' : 'Viewer',
      },
      abilityRules,
      sessionExpiresAt: expiresAt.toISOString(),
      sessionSecret,
      expiresAt,
    };
  }

  async logout(sessionToken?: string | null): Promise<void> {
    if (!sessionToken) return;

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    await this.sessionRepository.update(
      { tokenHash },
      { revokedAt: new Date() },
    );
  }

  async validateSession(
    token: string,
  ): Promise<{ user: ApplicationUserEntity; session: ApplicationSessionEntity } | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.sessionRepository.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!session || !session.user || !session.user.isActive) {
      return null;
    }

    return { user: session.user, session };
  }

  getCurrentUser(user: ApplicationUserEntity, session: ApplicationSessionEntity): CurrentUserDto {
    const ability = this.caslAbilityFactory.createForUser(user);
    const abilityRules = this.caslAbilityFactory.getSanitizedRules(ability);

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayRole: user.role === 'manager' ? 'Manager' : 'Viewer',
      },
      abilityRules,
      sessionExpiresAt: session.expiresAt.toISOString(),
    };
  }
}
