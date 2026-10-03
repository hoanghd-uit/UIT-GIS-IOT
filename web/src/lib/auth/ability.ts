import { createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';
import { AbilityRule } from '../../types/auth';

export type ClientAppAbility = MongoAbility<[string, string]>;

/**
 * Creates a CASL ability instance from sanitized rules received from the server.
 * If rules are empty or undefined, produces a fail-closed instance denying all operations.
 */
export function createAbilityFromRules(rules?: AbilityRule[] | RawRuleOf<ClientAppAbility>[] | null): ClientAppAbility {
  if (!rules || rules.length === 0) {
    return createMongoAbility([]);
  }
  return createMongoAbility(rules as any[]);
}

export function buildAbilityFromRules(rules?: AbilityRule[] | RawRuleOf<ClientAppAbility>[] | null): ClientAppAbility {
  return createAbilityFromRules(rules);
}

/**
 * Fallback static role rule definer matching server CASL authority.
 */
export function defineRulesForRole(role: string): AbilityRule[] {
  const rules: AbilityRule[] = [];

  if (role === 'viewer') {
    rules.push({ action: 'read', subject: 'Dashboard' });
    rules.push({ action: 'read', subject: 'DeviceDisplayPosition' });
    rules.push({ action: 'read', subject: 'FireExtinguisher' });
    rules.push({ action: 'read', subject: 'FireDrill' });
    rules.push({ inverted: true, action: 'create', subject: 'all' });
    rules.push({ inverted: true, action: 'update', subject: 'all' });
    rules.push({ inverted: true, action: 'delete', subject: 'all' });
    rules.push({ inverted: true, action: 'update', subject: 'DeviceDisplayPosition' });
    rules.push({ inverted: true, action: 'delete', subject: 'DeviceDisplayPosition' });
  } else if (role === 'manager') {
    rules.push({ action: 'read', subject: 'Dashboard' });
    rules.push({ action: 'read', subject: 'DeviceDisplayPosition' });
    rules.push({ action: 'manage', subject: 'FireExtinguisher' });
    rules.push({ action: 'manage', subject: 'FireDrill' });
    rules.push({ inverted: true, action: 'update', subject: 'DeviceDisplayPosition' });
    rules.push({ inverted: true, action: 'delete', subject: 'DeviceDisplayPosition' });
  }

  return rules;
}

/**
 * Safe client-side permission checker helper.
 */
export function canPerform(
  ability: ClientAppAbility | null | undefined,
  action: string,
  subject: string,
): boolean {
  if (!ability) return false;
  return ability.can(action, subject);
}

