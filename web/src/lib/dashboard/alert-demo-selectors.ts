/**
 * GIS-UIT Building E Digital Twin - Pure Demo Selectors
 * Big Phase 02 / Phase 06 Baseline
 *
 * CRITICAL INVARIANTS:
 * - Pure functions taking frozen reference time
 * - Zero mutation of input arrays
 * - Returns internally consistent KPI, list, chart, and efficiency values
 */

import {
  DemoAlertEvent,
  AlertTimeRangePreset,
  AlertSeverityFilter,
  AlertSortOrder,
  AlertKpiSummary,
  AlertHistoryBarItem,
  AlertHandlingEfficiency,
} from '@/types/dashboard-alerts';
import {
  ALERT_REFERENCE_INSTANT,
  DEMO_NOTIFICATION_CHANNELS,
} from './alert-demo-fixtures';

export interface FilterOptions {
  range?: AlertTimeRangePreset;
  severity?: AlertSeverityFilter;
  searchQuery?: string;
  referenceInstant?: string;
}

/**
 * Filter alert events by range, severity, and text search.
 */
export function filterAlertEvents(
  events: DemoAlertEvent[],
  options?: FilterOptions,
): DemoAlertEvent[] {
  const range = options?.range ?? '7d';
  const severity = options?.severity ?? 'all';
  const query = options?.searchQuery?.trim().toLowerCase() ?? '';
  const refTime = Date.parse(options?.referenceInstant ?? ALERT_REFERENCE_INSTANT);

  // Determine window start time
  let rangeMs = 7 * 24 * 60 * 60 * 1000; // default 7d
  if (range === 'today') {
    rangeMs = 24 * 60 * 60 * 1000;
  } else if (range === '30d') {
    rangeMs = 30 * 24 * 60 * 60 * 1000;
  }
  const windowStartMs = refTime - rangeMs;

  return events.filter((ev) => {
    const evTime = Date.parse(ev.detectedAt);

    // 1. Time range gate: detectedAt between [windowStartMs, refTime]
    if (evTime < windowStartMs || evTime > refTime) {
      return false;
    }

    // 2. Severity filter
    if (severity !== 'all' && ev.severity !== severity) {
      return false;
    }

    // 3. Search query filter
    if (query) {
      const matchTitle = ev.title.toLowerCase().includes(query);
      const matchId = ev.alertId.toLowerCase().includes(query);
      const matchLoc = ev.locationLabel.toLowerCase().includes(query);
      const matchDev = ev.demoDeviceId.toLowerCase().includes(query);
      const matchRole = ev.demoAssigneeRole?.toLowerCase().includes(query) ?? false;

      if (!matchTitle && !matchId && !matchLoc && !matchDev && !matchRole) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort events chronologically without mutating input array.
 */
export function sortAlertEvents(
  events: DemoAlertEvent[],
  order: AlertSortOrder = 'newest',
): DemoAlertEvent[] {
  const sorted = [...events];
  sorted.sort((a, b) => {
    const timeA = Date.parse(a.detectedAt);
    const timeB = Date.parse(b.detectedAt);
    return order === 'newest' ? timeB - timeA : timeA - timeB;
  });
  return sorted;
}

/**
 * Derive KPI metrics from current filtered & active events.
 */
export function getAlertKpis(
  filteredEvents: DemoAlertEvent[],
  allEvents: DemoAlertEvent[],
  referenceInstant: string = ALERT_REFERENCE_INSTANT,
): AlertKpiSummary {
  const refTime = Date.parse(referenceInstant);

  // 1. Open events (from all events in the system, or current active)
  const openEvents = allEvents.filter(
    (ev) => ev.lifecycleStatus === 'new' || ev.lifecycleStatus === 'acknowledged',
  );
  const openCount = openEvents.length;

  let warningCount = 0;
  let dangerCount = 0;
  let infoCount = 0;
  for (const ev of openEvents) {
    if (ev.severity === 'danger') dangerCount++;
    else if (ev.severity === 'warning') warningCount++;
    else if (ev.severity === 'info') infoCount++;
  }

  // 2. SLA Overdue count among open events
  let slaOverdueCount = 0;
  for (const ev of openEvents) {
    if (ev.slaDueAt && Date.parse(ev.slaDueAt) < refTime) {
      slaOverdueCount++;
    }
  }

  // 3. New events in currently selected range
  const newInRangeCount = filteredEvents.filter((ev) => ev.lifecycleStatus === 'new').length;

  // 4. Average acknowledge time (minutes) from events with both detected and acknowledged steps
  let totalAckMinutes = 0;
  let ackCount = 0;
  for (const ev of allEvents) {
    const detectedStep = ev.timeline.find((t) => t.type === 'detected');
    const ackStep = ev.timeline.find((t) => t.type === 'acknowledged');
    if (detectedStep && ackStep) {
      const diffMs = Date.parse(ackStep.timestamp) - Date.parse(detectedStep.timestamp);
      if (diffMs > 0) {
        totalAckMinutes += diffMs / (1000 * 60);
        ackCount++;
      }
    }
  }
  const avgAcknowledgeMinutes = ackCount > 0 ? Math.round((totalAckMinutes / ackCount) * 10) / 10 : 8.5;

  return {
    openCount,
    warningCount,
    dangerCount,
    infoCount,
    slaOverdueCount,
    newInRangeCount,
    avgAcknowledgeMinutes,
    channelCount: DEMO_NOTIFICATION_CHANNELS.length,
  };
}

/**
 * Derive 14-day history bar chart data.
 */
export function get14DayEventHistory(
  events: DemoAlertEvent[],
  referenceInstant: string = ALERT_REFERENCE_INSTANT,
): AlertHistoryBarItem[] {
  const refDate = new Date(referenceInstant);
  const items: AlertHistoryBarItem[] = [];

  // Generate 14 days ending on refDate
  for (let i = 13; i >= 0; i--) {
    const d = new Date(refDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const label = `${day}/${month}`;

    // Count events detected on this UTC day
    const count = events.filter((ev) => ev.detectedAt.startsWith(dateStr)).length;

    items.push({
      date: dateStr,
      label,
      count,
    });
  }

  return items;
}

/**
 * Derive Handling Efficiency metrics.
 */
export function getHandlingEfficiencyMetrics(
  events: DemoAlertEvent[],
): AlertHandlingEfficiency {
  let totalAckMinutes = 0;
  let ackCount = 0;

  let totalResMinutes = 0;
  let resCount = 0;

  let slaEvaluatedCount = 0;
  let metSlaCount = 0;

  for (const ev of events) {
    const detected = ev.timeline.find((t) => t.type === 'detected');
    const ack = ev.timeline.find((t) => t.type === 'acknowledged');
    const res = ev.timeline.find((t) => t.type === 'resolved' || t.type === 'closed');

    if (detected && ack) {
      const diffMs = Date.parse(ack.timestamp) - Date.parse(detected.timestamp);
      if (diffMs > 0) {
        totalAckMinutes += diffMs / (1000 * 60);
        ackCount++;
      }
    }

    if (detected && res) {
      const diffMs = Date.parse(res.timestamp) - Date.parse(detected.timestamp);
      if (diffMs > 0) {
        totalResMinutes += diffMs / (1000 * 60);
        resCount++;
      }
    }

    if (ev.slaDueAt && res) {
      slaEvaluatedCount++;
      if (Date.parse(res.timestamp) <= Date.parse(ev.slaDueAt)) {
        metSlaCount++;
      }
    }
  }

  const avgAck = ackCount > 0 ? Math.round((totalAckMinutes / ackCount) * 10) / 10 : 8.5;
  const avgRes = resCount > 0 ? Math.round((totalResMinutes / resCount) * 10) / 10 : 42.0;
  const withinSlaRate = slaEvaluatedCount > 0 ? Math.round((metSlaCount / slaEvaluatedCount) * 100) : 88;

  return {
    avgAcknowledgeMinutes: avgAck,
    avgResolutionMinutes: avgRes,
    withinSlaRate,
    reviewFalsePositiveRate: 4, // 4% fixture-derived review rate
  };
}
