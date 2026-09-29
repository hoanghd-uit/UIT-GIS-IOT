import { ApiProperty } from '@nestjs/swagger';

export class AlertEvaluationStatusProvenanceDto {
  @ApiProperty({ example: 'derived', enum: ['derived'] })
  mode: 'derived';

  @ApiProperty({ example: 'application_alert_evaluator' })
  sourceType: string;

  @ApiProperty({ example: '2026-09-29T12:00:00.000Z' })
  evaluatedAt: string;

  @ApiProperty({ type: [String] })
  caveats: string[];
}

export class AlertEvaluationStatusCapabilitiesDto {
  @ApiProperty({ example: true })
  evaluatorAvailable: boolean;

  @ApiProperty({ example: 0 })
  authoritativeRuleCount: number;

  @ApiProperty({ example: false })
  eventPersistenceAvailable: boolean;

  @ApiProperty({ example: false })
  lifecycleActionsAvailable: boolean;

  @ApiProperty({ example: false })
  notificationDeliveryAvailable: boolean;

  @ApiProperty({ example: false })
  authorizationAvailable: boolean;

  @ApiProperty({ example: false })
  spatialNavigationAvailable: boolean;
}

export class AlertEvaluationStatusBlockerDto {
  @ApiProperty({ example: 'ALERT_RULES_NOT_CONFIRMED' })
  code: string;

  @ApiProperty({
    example:
      'Chưa có quy tắc authoritative do semantics, baseline, cadence và duration policy chưa được xác nhận.',
  })
  message: string;
}

export class AlertEvaluationCurrentStateDto {
  @ApiProperty({ example: null, nullable: true, type: Number })
  distinctWarningDeviceCount: number | null;

  @ApiProperty({ example: null, nullable: true, type: Number })
  distinctDangerDeviceCount: number | null;

  @ApiProperty({ example: null, nullable: true, type: Number })
  notificationBadgeCount: number | null;
}

export class DashboardAlertEvaluationStatusResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: number;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: 'no_active_rules', enum: ['no_active_rules', 'ready', 'partial'] })
  availability: 'no_active_rules' | 'ready' | 'partial';

  @ApiProperty({ type: AlertEvaluationStatusProvenanceDto })
  provenance: AlertEvaluationStatusProvenanceDto;

  @ApiProperty({ type: AlertEvaluationStatusCapabilitiesDto })
  capabilities: AlertEvaluationStatusCapabilitiesDto;

  @ApiProperty({ type: [AlertEvaluationStatusBlockerDto] })
  blockers: AlertEvaluationStatusBlockerDto[];

  @ApiProperty({ type: AlertEvaluationCurrentStateDto })
  currentState: AlertEvaluationCurrentStateDto;
}
