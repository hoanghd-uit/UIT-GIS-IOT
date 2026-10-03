import { Injectable, BadRequestException } from '@nestjs/common';
import { AlertRuleRegistry } from './alert-rule-registry';
import { DashboardAlertEvaluationStatusResponseDto } from './dto/dashboard-alert-evaluation-status-response.dto';

@Injectable()
export class DashboardAlertStatusService {
  constructor(private readonly ruleRegistry: AlertRuleRegistry) {}

  /**
   * Get evaluation status for Building E.
   *
   * CRITICAL INVARIANTS:
   * - Building E only.
   * - GET / read-only.
   * - With empty registry, makes ZERO catalogue/telemetry/upstream calls.
   * - ZERO database read/write.
   * - Returns null for unavailable counts (never false 0).
   */
  async getEvaluationStatus(buildingId: string): Promise<DashboardAlertEvaluationStatusResponseDto> {
    if (buildingId !== 'E') {
      throw new BadRequestException(
        `Building ${buildingId} is not supported. Dashboard alert evaluation is only available for building E.`,
      );
    }

    const registryStatus = this.ruleRegistry.getRegistryStatus();
    const evaluatedAt = new Date().toISOString();

    return {
      schemaVersion: 1,
      buildingId: 'E',
      availability: registryStatus.availability,
      provenance: {
        mode: 'derived',
        sourceType: 'application_alert_evaluator',
        evaluatedAt,
        caveats: [
          'Hệ thống đánh giá quy tắc (alert evaluator boundary) đã sẵn sàng trong bộ nhớ.',
          'Danh mục quy tắc authoritative hiện đang rỗng do chưa có thông số ngưỡng, chu kỳ và ngữ nghĩa phần cứng chính thức.',
        ],
      },
      capabilities: {
        evaluatorAvailable: true,
        authoritativeRuleCount: registryStatus.ruleCount,
        eventPersistenceAvailable: false,
        lifecycleActionsAvailable: false,
        notificationDeliveryAvailable: false,
        authorizationAvailable: false,
        spatialNavigationAvailable: false,
      },
      blockers: [
        {
          code: registryStatus.reasonCode,
          message: registryStatus.message,
        },
      ],
      currentState: {
        distinctWarningDeviceCount: null,
        distinctDangerDeviceCount: null,
        notificationBadgeCount: null,
      },
    };
  }
}
