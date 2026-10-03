import { BadRequestException } from '@nestjs/common';
import { DashboardAlertStatusService } from '../dashboard-alert-status.service';
import { AlertRuleRegistry } from '../alert-rule-registry';
import { DashboardAlertController } from '../dashboard-alert.controller';

describe('DashboardAlertStatus & Controller (Read-only Boundary)', () => {
  let ruleRegistry: AlertRuleRegistry;
  let statusService: DashboardAlertStatusService;
  let controller: DashboardAlertController;

  beforeEach(() => {
    ruleRegistry = new AlertRuleRegistry();
    statusService = new DashboardAlertStatusService(ruleRegistry);
    controller = new DashboardAlertController(statusService);
  });

  describe('Building Validation & Read-Only Invariants', () => {
    it('accepts building E and returns evaluation status', async () => {
      const res = await controller.getEvaluationStatus('E');
      expect(res.buildingId).toBe('E');
      expect(res.schemaVersion).toBe(1);
    });

    it('rejects unsupported building with BadRequestException', async () => {
      await expect(controller.getEvaluationStatus('A')).rejects.toThrow(BadRequestException);
      await expect(controller.getEvaluationStatus('123')).rejects.toThrow(BadRequestException);
    });

    it('returns availability no_active_rules when authoritative registry is empty', async () => {
      const res = await controller.getEvaluationStatus('E');
      expect(res.availability).toBe('no_active_rules');
      expect(res.capabilities.authoritativeRuleCount).toBe(0);
    });

    it('preserves null for counts when operational state is unconfirmed (never false 0)', async () => {
      const res = await controller.getEvaluationStatus('E');
      expect(res.currentState.distinctWarningDeviceCount).toBeNull();
      expect(res.currentState.distinctDangerDeviceCount).toBeNull();
      expect(res.currentState.notificationBadgeCount).toBeNull();
    });

    it('discloses accurate capability flags and blockers', async () => {
      const res = await controller.getEvaluationStatus('E');
      expect(res.capabilities.evaluatorAvailable).toBe(true);
      expect(res.capabilities.eventPersistenceAvailable).toBe(false);
      expect(res.capabilities.lifecycleActionsAvailable).toBe(false);
      expect(res.capabilities.notificationDeliveryAvailable).toBe(false);
      expect(res.capabilities.authorizationAvailable).toBe(false);
      expect(res.capabilities.spatialNavigationAvailable).toBe(false);

      expect(res.blockers).toHaveLength(1);
      expect(res.blockers[0].code).toBe('ALERT_RULES_NOT_CONFIRMED');
    });

    it('ensures zero mutation endpoints exist on DashboardAlertController', () => {
      const prototype = Object.getPrototypeOf(controller);
      const methods = Object.getOwnPropertyNames(prototype).filter((m) => m !== 'constructor');

      // Controller should ONLY have getEvaluationStatus
      expect(methods).toEqual(['getEvaluationStatus']);

      // Explicitly assert lack of mutation methods
      expect(methods).not.toContain('acknowledgeAlert');
      expect(methods).not.toContain('assignAlert');
      expect(methods).not.toContain('resolveAlert');
      expect(methods).not.toContain('createRule');
      expect(methods).not.toContain('updateRule');
      expect(methods).not.toContain('deleteRule');
    });
  });
});
