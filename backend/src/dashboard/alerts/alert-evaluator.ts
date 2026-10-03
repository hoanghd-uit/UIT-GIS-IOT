/**
 * GIS-UIT Building E Digital Twin - Alert Center Baseline
 * Pure In-Memory Alert Evaluator Boundary
 *
 * Requirements (Big Phase 02 / Phase 06):
 * - Pure evaluation logic taking typed samples and explicit rule definitions
 * - Zero database access, zero upstream calls
 * - Preserves valid 0, rejects non-finite/NaN and unconfirmed semantics/units
 * - Danger takes precedence over Warning
 * - Copies and sorts newest-first input to oldest-first chronologically
 * - Does not interpolate gaps
 * - Returns not_evaluated with explicit reason codes for duration rules without complete policy
 */

export interface AlertMetricSample {
  deviceId: string;
  deviceType: string;
  metricKey: string;
  observedAt: string; // ISO8601 string
  value: number;
  unit: string | null;
  semanticStatus: 'confirmed' | 'unconfirmed';
  sourceProvenance?: string;
}

export interface AlertRuleDefinition {
  ruleId: string;
  version: string | number;
  deviceType: string;
  metricKey: string;
  warningLow?: number | null;
  warningHigh?: number | null;
  dangerLow?: number | null;
  dangerHigh?: number | null;
  alertTimeThresholdSeconds?: number | null;
  expectedCadenceSeconds?: number | null;
  gapToleranceSeconds?: number | null;
  enabled: boolean;
  source: 'approved_baseline' | 'approved_custom';
  unit?: string | null;
}

export type AlertEvaluationStatus = 'normal' | 'warning' | 'danger' | 'not_evaluated';

export interface AlertEvaluationResult {
  deviceId: string;
  metricKey: string;
  status: AlertEvaluationStatus;
  reasonCode: string;
  evaluatedAt: string;
  sourceWindow: { start: string; stop: string } | null;
  evidenceSampleCount: number;
  ruleId: string | null;
  ruleVersion: string | number | null;
  caveats: string[];
}

export interface AlertEvaluationOptions {
  evaluatedAt?: string;
  sourceWindow?: { start: string; stop: string } | null;
}

/**
 * Pure alert evaluation function.
 */
export function evaluateAlert(
  samples: AlertMetricSample[],
  rule: AlertRuleDefinition | null | undefined,
  options?: AlertEvaluationOptions,
): AlertEvaluationResult {
  const evaluatedAt = options?.evaluatedAt ?? new Date().toISOString();
  const sourceWindow = options?.sourceWindow ?? null;

  // 1. Check for rule existence & enabled state
  if (!rule) {
    return {
      deviceId: samples?.[0]?.deviceId ?? 'unknown',
      metricKey: samples?.[0]?.metricKey ?? 'unknown',
      status: 'not_evaluated',
      reasonCode: 'NO_MATCHING_RULE',
      evaluatedAt,
      sourceWindow,
      evidenceSampleCount: samples?.length ?? 0,
      ruleId: null,
      ruleVersion: null,
      caveats: ['Không tìm thấy quy tắc đánh giá phù hợp.'],
    };
  }

  if (!rule.enabled) {
    return {
      deviceId: samples?.[0]?.deviceId ?? 'unknown',
      metricKey: rule.metricKey,
      status: 'not_evaluated',
      reasonCode: 'RULE_DISABLED',
      evaluatedAt,
      sourceWindow,
      evidenceSampleCount: samples?.length ?? 0,
      ruleId: rule.ruleId,
      ruleVersion: rule.version,
      caveats: ['Quy tắc đánh giá đang ở trạng thái vô hiệu hóa.'],
    };
  }

  // 2. Check for empty samples
  if (!samples || samples.length === 0) {
    return {
      deviceId: 'unknown',
      metricKey: rule.metricKey,
      status: 'not_evaluated',
      reasonCode: 'NO_SAMPLES',
      evaluatedAt,
      sourceWindow,
      evidenceSampleCount: 0,
      ruleId: rule.ruleId,
      ruleVersion: rule.version,
      caveats: ['Không có mẫu dữ liệu để thực hiện đánh giá.'],
    };
  }

  const deviceId = samples[0].deviceId;
  const metricKey = rule.metricKey;

  // 3. Validate sample metadata (deviceType, metricKey, semanticStatus, unit)
  for (const s of samples) {
    if (s.deviceType !== rule.deviceType) {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'DEVICE_TYPE_MISMATCH',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: samples.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: [`Loại thiết bị mẫu (${s.deviceType}) không khớp với quy tắc (${rule.deviceType}).`],
      };
    }

    if (s.metricKey !== rule.metricKey) {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'METRIC_KEY_MISMATCH',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: samples.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: [`Khóa chỉ số mẫu (${s.metricKey}) không khớp với quy tắc (${rule.metricKey}).`],
      };
    }

    if (s.semanticStatus === 'unconfirmed') {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'SEMANTIC_STATUS_UNCONFIRMED',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: samples.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: ['Chỉ số đo lường chưa được xác nhận ý nghĩa kỹ thuật (unconfirmed semantics).'],
      };
    }

    if (rule.unit != null && s.unit !== rule.unit) {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'UNIT_MISMATCH',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: samples.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: [`Đơn vị mẫu (${s.unit ?? 'null'}) không khớp với đơn vị quy tắc (${rule.unit}).`],
      };
    }

    // Check validity of value: must be finite number (note: 0 is valid!)
    if (s.value == null || !Number.isFinite(s.value)) {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'INVALID_SAMPLE_VALUE',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: samples.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: ['Mẫu dữ liệu chứa giá trị rỗng, NaN hoặc không hữu hạn.'],
      };
    }

    // Check validity of observedAt timestamp
    if (!s.observedAt || Number.isNaN(Date.parse(s.observedAt))) {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'INVALID_SAMPLE_TIMESTAMP',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: samples.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: ['Mẫu dữ liệu chứa timestamp không hợp lệ.'],
      };
    }
  }

  // 4. Copy and sort chronologically (oldest-first) without mutating the input array
  const sorted = [...samples].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));

  // Deduplicate timestamps deterministically: if duplicate observedAt, retain the last one
  const deduped: AlertMetricSample[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i < sorted.length - 1 && sorted[i].observedAt === sorted[i + 1].observedAt) {
      continue; // Skip earlier duplicate, keep the latter
    }
    deduped.push(sorted[i]);
  }

  // 5. Evaluate Duration Threshold (alertTimeThresholdSeconds)
  const durationThresholdSec = rule.alertTimeThresholdSeconds ?? 0;
  if (durationThresholdSec > 0) {
    // If cadence or gap policy is unconfirmed/missing, reject runtime evaluation
    if (rule.expectedCadenceSeconds == null || rule.expectedCadenceSeconds <= 0) {
      return {
        deviceId,
        metricKey,
        status: 'not_evaluated',
        reasonCode: 'DURATION_CADENCE_POLICY_UNCONFIRMED',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: deduped.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: [
          'Quy tắc thời gian vượt ngưỡng chưa thể đánh giá vì chu kỳ lấy mẫu (cadence) chưa được phê duyệt.',
        ],
      };
    }

    const gapToleranceSec = rule.gapToleranceSeconds ?? rule.expectedCadenceSeconds * 1.5;

    // Check continuous exceedance from newest sample backwards
    let activeSeverity: 'danger' | 'warning' | null = null;
    let continuousStartTimeMs: number | null = null;

    // Helper to test a sample value against danger/warning
    const checkSampleSeverity = (val: number): 'danger' | 'warning' | null => {
      const isDanger =
        (rule.dangerLow != null && val <= rule.dangerLow) ||
        (rule.dangerHigh != null && val >= rule.dangerHigh);
      if (isDanger) return 'danger';

      const isWarning =
        (rule.warningLow != null && val <= rule.warningLow) ||
        (rule.warningHigh != null && val >= rule.warningHigh);
      if (isWarning) return 'warning';

      return null;
    };

    // Traverse from newest to oldest
    for (let i = deduped.length - 1; i >= 0; i--) {
      const cur = deduped[i];
      const curTime = Date.parse(cur.observedAt);
      const sev = checkSampleSeverity(cur.value);

      if (i === deduped.length - 1) {
        if (!sev) {
          // Latest sample is normal
          return {
            deviceId,
            metricKey,
            status: 'normal',
            reasonCode: 'WITHIN_NORMAL_RANGE',
            evaluatedAt,
            sourceWindow,
            evidenceSampleCount: deduped.length,
            ruleId: rule.ruleId,
            ruleVersion: rule.version,
            caveats: [],
          };
        }
        activeSeverity = sev;
        continuousStartTimeMs = curTime;
      } else {
        const nextNewer = deduped[i + 1];
        const nextTime = Date.parse(nextNewer.observedAt);
        const timeDiffSec = (nextTime - curTime) / 1000;

        // Gap check: if gap exceeds tolerance, continuity breaks
        if (timeDiffSec > gapToleranceSec) {
          break;
        }

        // If severity matches or escalates, continue duration window
        if (sev === activeSeverity || (activeSeverity === 'warning' && sev === 'danger')) {
          continuousStartTimeMs = curTime;
        } else {
          // Non-exceedance sample broke continuity
          break;
        }
      }
    }

    const newestTimeMs = Date.parse(deduped[deduped.length - 1].observedAt);
    const continuousDurationSec =
      continuousStartTimeMs != null ? (newestTimeMs - continuousStartTimeMs) / 1000 : 0;

    if (continuousDurationSec >= durationThresholdSec && activeSeverity != null) {
      return {
        deviceId,
        metricKey,
        status: activeSeverity,
        reasonCode:
          activeSeverity === 'danger'
            ? 'DANGER_THRESHOLD_EXCEEDED_WITH_DURATION'
            : 'WARNING_THRESHOLD_EXCEEDED_WITH_DURATION',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: deduped.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: [
          `Đã duy trì ngưỡng ${activeSeverity} liên tục ${continuousDurationSec}s (ngưỡng: ${durationThresholdSec}s).`,
        ],
      };
    } else {
      // Threshold not exceeded for required duration
      return {
        deviceId,
        metricKey,
        status: 'normal',
        reasonCode: 'DURATION_THRESHOLD_NOT_MET',
        evaluatedAt,
        sourceWindow,
        evidenceSampleCount: deduped.length,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        caveats: [
          `Thời gian duy trì ngưỡng (${continuousDurationSec}s) chưa đạt ngưỡng yêu cầu (${durationThresholdSec}s).`,
        ],
      };
    }
  }

  // 6. Instantaneous Evaluation (no duration threshold)
  // Evaluate the latest sample in time
  const latestSample = deduped[deduped.length - 1];
  const value = latestSample.value;

  // Danger takes precedence over Warning
  const isDanger =
    (rule.dangerLow != null && value <= rule.dangerLow) ||
    (rule.dangerHigh != null && value >= rule.dangerHigh);

  if (isDanger) {
    return {
      deviceId,
      metricKey,
      status: 'danger',
      reasonCode: 'DANGER_THRESHOLD_EXCEEDED',
      evaluatedAt,
      sourceWindow,
      evidenceSampleCount: deduped.length,
      ruleId: rule.ruleId,
      ruleVersion: rule.version,
      caveats: [`Giá trị ${value} vượt ngưỡng nguy hiểm (${rule.dangerHigh ?? rule.dangerLow}).`],
    };
  }

  const isWarning =
    (rule.warningLow != null && value <= rule.warningLow) ||
    (rule.warningHigh != null && value >= rule.warningHigh);

  if (isWarning) {
    return {
      deviceId,
      metricKey,
      status: 'warning',
      reasonCode: 'WARNING_THRESHOLD_EXCEEDED',
      evaluatedAt,
      sourceWindow,
      evidenceSampleCount: deduped.length,
      ruleId: rule.ruleId,
      ruleVersion: rule.version,
      caveats: [`Giá trị ${value} vượt ngưỡng cảnh báo (${rule.warningHigh ?? rule.warningLow}).`],
    };
  }

  return {
    deviceId,
    metricKey,
    status: 'normal',
    reasonCode: 'WITHIN_NORMAL_RANGE',
    evaluatedAt,
    sourceWindow,
    evidenceSampleCount: deduped.length,
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    caveats: [],
  };
}
