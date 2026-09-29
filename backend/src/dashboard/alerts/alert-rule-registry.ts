import { Injectable } from '@nestjs/common';
import { AlertRuleDefinition } from './alert-evaluator';

export interface AlertRegistryStatus {
  availability: 'no_active_rules' | 'ready' | 'partial';
  reasonCode: string;
  message: string;
  ruleCount: number;
}

/**
 * Authoritative Alert Rule Registry (NestJS Service)
 *
 * CRITICAL INVARIANT (Phase 06):
 * - Production/runtime registry is an explicit typed empty list in Phase 06.
 * - Carrying reason code ALERT_RULES_NOT_CONFIRMED.
 * - Demo rules live in frontend demo fixtures and must never enter this registry.
 */
@Injectable()
export class AlertRuleRegistry {
  private readonly authoritativeRules: ReadonlyArray<AlertRuleDefinition> = Object.freeze([]);

  /**
   * Returns current authoritative rules.
   * Strictly empty in Phase 06.
   */
  getAuthoritativeRules(): AlertRuleDefinition[] {
    return [...this.authoritativeRules];
  }

  /**
   * Returns registry status and blockers.
   */
  getRegistryStatus(): AlertRegistryStatus {
    return {
      availability: 'no_active_rules',
      reasonCode: 'ALERT_RULES_NOT_CONFIRMED',
      message:
        'Chưa có quy tắc authoritative do semantics, baseline, cadence và duration policy chưa được xác nhận bởi đội ngũ phần cứng.',
      ruleCount: this.authoritativeRules.length,
    };
  }
}
