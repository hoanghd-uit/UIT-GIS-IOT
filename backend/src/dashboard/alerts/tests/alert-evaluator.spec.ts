import {
  evaluateAlert,
  AlertMetricSample,
  AlertRuleDefinition,
} from '../alert-evaluator';

describe('AlertEvaluator (Pure In-Memory Domain Boundary)', () => {
  const baseRule: AlertRuleDefinition = {
    ruleId: 'TEST-RULE-CO2-01',
    version: 1,
    deviceType: 'solar',
    metricKey: 'co2',
    unit: 'ppm',
    warningHigh: 800,
    dangerHigh: 1000,
    enabled: true,
    source: 'approved_custom',
  };

  const createSample = (overrides?: Partial<AlertMetricSample>): AlertMetricSample => ({
    deviceId: 'DEV-SOLAR-001',
    deviceType: 'solar',
    metricKey: 'co2',
    observedAt: '2026-09-29T10:00:00.000Z',
    value: 650,
    unit: 'ppm',
    semanticStatus: 'confirmed',
    ...overrides,
  });

  describe('Validation & Not-Evaluated Conditions', () => {
    it('returns not_evaluated when rule is null or undefined', () => {
      const sample = createSample();
      const res = evaluateAlert([sample], null);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('NO_MATCHING_RULE');
      expect(res.ruleId).toBeNull();
    });

    it('returns not_evaluated when rule is disabled', () => {
      const disabledRule = { ...baseRule, enabled: false };
      const sample = createSample();
      const res = evaluateAlert([sample], disabledRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('RULE_DISABLED');
      expect(res.ruleId).toBe('TEST-RULE-CO2-01');
    });

    it('returns not_evaluated when samples array is empty', () => {
      const res = evaluateAlert([], baseRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('NO_SAMPLES');
      expect(res.evidenceSampleCount).toBe(0);
    });

    it('returns not_evaluated when deviceType does not match rule', () => {
      const sample = createSample({ deviceType: 'avc' });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('DEVICE_TYPE_MISMATCH');
    });

    it('returns not_evaluated when metricKey does not match rule', () => {
      const sample = createSample({ metricKey: 'temperature' });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('METRIC_KEY_MISMATCH');
    });

    it('returns not_evaluated when semanticStatus is unconfirmed', () => {
      const sample = createSample({ semanticStatus: 'unconfirmed' });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('SEMANTIC_STATUS_UNCONFIRMED');
    });

    it('returns not_evaluated when unit does not match confirmed rule unit', () => {
      const sample = createSample({ unit: 'ppb' });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('UNIT_MISMATCH');
    });

    it('returns not_evaluated when value is null, NaN, or non-finite', () => {
      const nullSample = createSample({ value: null as unknown as number });
      expect(evaluateAlert([nullSample], baseRule).reasonCode).toBe('INVALID_SAMPLE_VALUE');

      const nanSample = createSample({ value: NaN });
      expect(evaluateAlert([nanSample], baseRule).reasonCode).toBe('INVALID_SAMPLE_VALUE');

      const infSample = createSample({ value: Infinity });
      expect(evaluateAlert([infSample], baseRule).reasonCode).toBe('INVALID_SAMPLE_VALUE');
    });

    it('preserves valid zero value as a legitimate measurement', () => {
      const zeroRule: AlertRuleDefinition = {
        ruleId: 'TEST-RULE-FLOW-01',
        version: 1,
        deviceType: 'avc',
        metricKey: 'flowRate',
        unit: 'm3/h',
        warningLow: 0.1, // Zero is below warningLow
        enabled: true,
        source: 'approved_custom',
      };
      const zeroSample = createSample({
        deviceType: 'avc',
        metricKey: 'flowRate',
        unit: 'm3/h',
        value: 0,
      });

      const res = evaluateAlert([zeroSample], zeroRule);
      expect(res.status).toBe('warning');
      expect(res.reasonCode).toBe('WARNING_THRESHOLD_EXCEEDED');
    });

    it('returns not_evaluated when observedAt timestamp is invalid', () => {
      const invalidTimeSample = createSample({ observedAt: 'invalid-date' });
      const res = evaluateAlert([invalidTimeSample], baseRule);
      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('INVALID_SAMPLE_TIMESTAMP');
    });
  });

  describe('Value Threshold & Precedence Evaluation', () => {
    it('evaluates normal when sample is within boundaries', () => {
      const sample = createSample({ value: 600 });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('normal');
      expect(res.reasonCode).toBe('WITHIN_NORMAL_RANGE');
      expect(res.ruleId).toBe('TEST-RULE-CO2-01');
      expect(res.ruleVersion).toBe(1);
    });

    it('evaluates warning when warningHigh threshold is exceeded', () => {
      const sample = createSample({ value: 850 });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('warning');
      expect(res.reasonCode).toBe('WARNING_THRESHOLD_EXCEEDED');
    });

    it('evaluates danger when dangerHigh threshold is exceeded', () => {
      const sample = createSample({ value: 1100 });
      const res = evaluateAlert([sample], baseRule);
      expect(res.status).toBe('danger');
      expect(res.reasonCode).toBe('DANGER_THRESHOLD_EXCEEDED');
    });

    it('ensures danger takes precedence over warning when ranges overlap', () => {
      // Overlapping rule: dangerHigh 900, warningHigh 800. Sample 1000 meets both.
      const overlapRule: AlertRuleDefinition = {
        ruleId: 'TEST-OVERLAP-01',
        version: '1.0',
        deviceType: 'solar',
        metricKey: 'co2',
        unit: 'ppm',
        warningHigh: 800,
        dangerHigh: 900,
        enabled: true,
        source: 'approved_custom',
      };
      const sample = createSample({ value: 1000 });
      const res = evaluateAlert([sample], overlapRule);
      expect(res.status).toBe('danger');
      expect(res.reasonCode).toBe('DANGER_THRESHOLD_EXCEEDED');
    });
  });

  describe('Chronological Ordering & Immutability', () => {
    it('does not mutate input array and correctly evaluates newest sample in time', () => {
      const s1 = createSample({ observedAt: '2026-09-29T10:00:00.000Z', value: 900 }); // older, warning
      const s2 = createSample({ observedAt: '2026-09-29T10:05:00.000Z', value: 500 }); // newest, normal

      // Pass newest first
      const input = [s2, s1];
      const res = evaluateAlert(input, baseRule);

      // Latest in time is s2 (normal)
      expect(res.status).toBe('normal');
      // Original array order preserved
      expect(input[0]).toBe(s2);
      expect(input[1]).toBe(s1);
    });

    it('handles duplicate timestamps deterministically', () => {
      const s1 = createSample({ observedAt: '2026-09-29T10:00:00.000Z', value: 600 });
      const s2 = createSample({ observedAt: '2026-09-29T10:00:00.000Z', value: 850 });

      const res = evaluateAlert([s1, s2], baseRule);
      expect(res.status).toBe('warning');
    });
  });

  describe('Duration Policy & Gaps', () => {
    it('returns not_evaluated for duration rule when cadence policy is unconfirmed', () => {
      const durationRuleWithoutCadence: AlertRuleDefinition = {
        ...baseRule,
        alertTimeThresholdSeconds: 300,
        expectedCadenceSeconds: null, // missing cadence
      };
      const sample = createSample({ value: 850 });
      const res = evaluateAlert([sample], durationRuleWithoutCadence);

      expect(res.status).toBe('not_evaluated');
      expect(res.reasonCode).toBe('DURATION_CADENCE_POLICY_UNCONFIRMED');
    });

    it('evaluates warning with duration when continuous exceedance meets threshold', () => {
      const durationRule: AlertRuleDefinition = {
        ...baseRule,
        alertTimeThresholdSeconds: 300, // 5 min
        expectedCadenceSeconds: 60, // 1 min
        gapToleranceSeconds: 90,
      };

      const samples = [
        createSample({ observedAt: '2026-09-29T10:00:00.000Z', value: 850 }),
        createSample({ observedAt: '2026-09-29T10:01:00.000Z', value: 860 }),
        createSample({ observedAt: '2026-09-29T10:02:00.000Z', value: 870 }),
        createSample({ observedAt: '2026-09-29T10:03:00.000Z', value: 880 }),
        createSample({ observedAt: '2026-09-29T10:04:00.000Z', value: 890 }),
        createSample({ observedAt: '2026-09-29T10:05:00.000Z', value: 900 }), // 5 minutes duration
      ];

      const res = evaluateAlert(samples, durationRule);
      expect(res.status).toBe('warning');
      expect(res.reasonCode).toBe('WARNING_THRESHOLD_EXCEEDED_WITH_DURATION');
    });

    it('does not infer continuous duration across gaps exceeding tolerance', () => {
      const durationRule: AlertRuleDefinition = {
        ...baseRule,
        alertTimeThresholdSeconds: 300, // 5 min
        expectedCadenceSeconds: 60,
        gapToleranceSeconds: 90, // gap tolerance 90s
      };

      // Gap of 10 minutes between sample 1 and sample 2!
      const samples = [
        createSample({ observedAt: '2026-09-29T10:00:00.000Z', value: 850 }),
        createSample({ observedAt: '2026-09-29T10:10:00.000Z', value: 850 }), // 10 min later
      ];

      const res = evaluateAlert(samples, durationRule);
      expect(res.status).toBe('normal');
      expect(res.reasonCode).toBe('DURATION_THRESHOLD_NOT_MET');
    });
  });
});
