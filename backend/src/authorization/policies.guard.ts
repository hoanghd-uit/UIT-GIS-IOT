import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_ABILITY_KEY, RequiredRule } from './require-ability.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    @Optional()
    private readonly reflector?: Reflector,
    @Optional()
    private readonly caslAbilityFactory?: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.reflector || !this.caslAbilityFactory) {
      return true;
    }
    const requiredRule = this.reflector.getAllAndOverride<RequiredRule | undefined>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const ability = this.caslAbilityFactory.createForUser(user);
    const isAllowed = ability.can(requiredRule.action, requiredRule.subject);

    if (!isAllowed) {
      throw new ForbiddenException(
        `Forbidden: Insufficient privileges for action '${requiredRule.action}' on subject '${requiredRule.subject}'.`,
      );
    }

    return true;
  }
}
