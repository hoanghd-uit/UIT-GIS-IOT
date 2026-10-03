import { SetMetadata } from '@nestjs/common';
import { AppAction, AppSubject } from './casl-ability.factory';

export const CHECK_ABILITY_KEY = 'check_ability';

export interface RequiredRule {
  action: AppAction;
  subject: AppSubject;
}

export const RequireAbility = (action: AppAction, subject: AppSubject) =>
  SetMetadata(CHECK_ABILITY_KEY, { action, subject } as RequiredRule);
