import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';

export type AppAction = 'read' | 'create' | 'update' | 'delete';
export type AppSubject =
  | 'Dashboard'
  | 'AlertConfig'
  | 'FireExtinguisher'
  | 'FireDrill'
  | 'DeviceDisplayPosition';

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export interface AbilityUser {
  id: string;
  username: string;
  role: 'viewer' | 'manager' | string;
  isActive: boolean;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user?: AbilityUser | null): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (!user || !user.isActive) {
      // Fail closed: anonymous or inactive users have no abilities
      return build();
    }

    switch (user.role) {
      case 'viewer':
        can('read', 'Dashboard');
        can('read', 'AlertConfig');
        can('read', 'FireExtinguisher');
        can('read', 'FireDrill');
        cannot('update', 'DeviceDisplayPosition');
        cannot('delete', 'DeviceDisplayPosition');
        break;

      case 'manager':
        can('read', 'Dashboard');
        can('read', 'AlertConfig');
        can('update', 'AlertConfig');
        cannot('create', 'AlertConfig');
        cannot('delete', 'AlertConfig');

        can('read', 'FireExtinguisher');
        can('create', 'FireExtinguisher');
        can('update', 'FireExtinguisher');
        can('delete', 'FireExtinguisher');

        can('read', 'FireDrill');
        can('create', 'FireDrill');
        can('update', 'FireDrill');
        can('delete', 'FireDrill');

        cannot('update', 'DeviceDisplayPosition');
        cannot('delete', 'DeviceDisplayPosition');
        break;

      default:
        // Unknown role: fail closed
        break;
    }

    return build();
  }

  /**
   * Sanitizes ability rules for client consumption.
   * Ensures no internal database identifiers, hashes, or sensitive attributes leak.
   */
  getSanitizedRules(ability: AppAbility): RawRuleOf<AppAbility>[] {
    return ability.rules.map((rule) => ({
      action: rule.action,
      subject: rule.subject,
      inverted: rule.inverted || false,
    }));
  }
}
