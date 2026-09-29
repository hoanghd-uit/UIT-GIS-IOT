/**
 * GIS-UIT Building E Digital Twin - Dashboard Alerts Types
 * Big Phase 02 / Phase 06 Baseline
 */

export type AlertSeverity = 'info' | 'warning' | 'danger';

export type AlertCategory = 'environment' | 'water' | 'iot' | 'energy';

export type AlertLifecycleStatus = 'new' | 'acknowledged' | 'resolved' | 'closed';

export interface DemoAlertTimelineItem {
  timestamp: string;
  title: string;
  description: string;
  actorRole?: string;
  type: 'detected' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
}

export interface DemoAlertEvent {
  alertId: string;
  subjectId: string;
  demoDeviceId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  locationLabel: string;
  detectedAt: string;
  lifecycleStatus: AlertLifecycleStatus;
  demoAssigneeRole: string | null;
  slaDueAt: string | null;
  timeline: DemoAlertTimelineItem[];
  suggestedActionText: string;
  ruleId: string;
  notificationChannels: string[];
  provenance: {
    mode: 'demo';
    fixtureId: string;
  };
}

export interface DemoAlertRule {
  ruleId: string;
  ruleName: string;
  category: AlertCategory;
  condition: string;
  severity: AlertSeverity;
  notificationChannels: string[];
  status: 'demo_active';
}

export type AlertTimeRangePreset = 'today' | '7d' | '30d';

export type AlertSeverityFilter = 'all' | 'danger' | 'warning' | 'info';

export type AlertSortOrder = 'newest' | 'oldest';

export interface AlertEvaluationStatusProvenance {
  mode: 'derived';
  sourceType: string;
  evaluatedAt: string;
  caveats: string[];
}

export interface AlertEvaluationStatusCapabilities {
  evaluatorAvailable: boolean;
  authoritativeRuleCount: number;
  eventPersistenceAvailable: boolean;
  lifecycleActionsAvailable: boolean;
  notificationDeliveryAvailable: boolean;
  authorizationAvailable: boolean;
  spatialNavigationAvailable: boolean;
}

export interface AlertEvaluationStatusBlocker {
  code: string;
  message: string;
}

export interface AlertEvaluationCurrentState {
  distinctWarningDeviceCount: number | null;
  distinctDangerDeviceCount: number | null;
  notificationBadgeCount: number | null;
}

export interface DashboardAlertEvaluationStatusResponse {
  schemaVersion: number;
  buildingId: string;
  availability: 'no_active_rules' | 'ready' | 'partial';
  provenance: AlertEvaluationStatusProvenance;
  capabilities: AlertEvaluationStatusCapabilities;
  blockers: AlertEvaluationStatusBlocker[];
  currentState: AlertEvaluationCurrentState;
}

export interface AlertKpiSummary {
  openCount: number;
  warningCount: number;
  dangerCount: number;
  infoCount: number;
  slaOverdueCount: number;
  newInRangeCount: number;
  avgAcknowledgeMinutes: number;
  channelCount: number;
}

export interface AlertHistoryBarItem {
  date: string; // YYYY-MM-DD
  label: string; // DD/MM
  count: number;
}

export interface AlertHandlingEfficiency {
  avgAcknowledgeMinutes: number;
  avgResolutionMinutes: number;
  withinSlaRate: number; // percentage, e.g. 88
  reviewFalsePositiveRate: number; // percentage, e.g. 5
}
