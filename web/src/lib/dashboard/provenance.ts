import {
  DashboardAvailability,
  DashboardDataMode,
  DashboardProvenance,
} from '@/types/dashboard';

export const DATA_MODE_LABELS: Record<DashboardDataMode, string> = {
  live: 'Dữ liệu thực',
  derived: 'Dữ liệu tổng hợp',
  manual: 'Dữ liệu nhập tay',
  demo: 'Dữ liệu demo',
};

export const AVAILABILITY_LABELS: Record<DashboardAvailability, string> = {
  ready: 'Sẵn sàng',
  empty: 'Không có dữ liệu',
  unavailable: 'Chưa kết nối',
  error: 'Lỗi nạp dữ liệu',
};

// Patterns forbidden in provenance fields for security
const FORBIDDEN_SECRET_PATTERNS = [
  /bearer\s+[a-zA-Z0-9._~+/-]+=*/i,
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /authorization/i,
  /at\s+[a-zA-Z0-9._$<>]+\s+\(.*:[0-9]+:[0-9]+\)/, // stack trace line
  /node_modules/i,
];

function isIsoDateString(val: string): boolean {
  if (typeof val !== 'string' || val.trim().length === 0) return false;
  const parsed = Date.parse(val);
  return !Number.isNaN(parsed);
}

function containsSecretOrTrace(text: string): boolean {
  return FORBIDDEN_SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

export interface ProvenanceValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a DashboardProvenance object against Big Phase 02 invariants.
 */
export function validateProvenance(prov: unknown): ProvenanceValidationResult {
  const errors: string[] = [];

  if (!prov || typeof prov !== 'object') {
    return { valid: false, errors: ['Provenance must be a non-null object'] };
  }

  const p = prov as Partial<DashboardProvenance>;

  // 1. Mode validation
  const validModes: DashboardDataMode[] = ['live', 'derived', 'manual', 'demo'];
  if (!p.mode || !validModes.includes(p.mode)) {
    errors.push(`Invalid or missing mode: '${p.mode}'. Must be one of ${validModes.join(', ')}`);
    return { valid: false, errors };
  }

  // 2. Demo mode invariant: requires non-empty fixtureVersion
  if (p.mode === 'demo') {
    if (!p.fixtureVersion || typeof p.fixtureVersion !== 'string' || p.fixtureVersion.trim() === '') {
      errors.push('Demo mode requires a non-empty fixtureVersion');
    }
  }

  // 3. Live mode invariant: must not claim fixtureVersion
  if (p.mode === 'live') {
    if (p.fixtureVersion !== undefined && p.fixtureVersion !== null) {
      errors.push('Live mode must not have fixtureVersion');
    }
  }

  // 4. ISO Date validation
  const dateFields: (keyof DashboardProvenance)[] = [
    'observedAt',
    'windowStart',
    'windowEnd',
    'fetchedAt',
    'calculatedAt',
  ];

  for (const field of dateFields) {
    const val = p[field];
    if (val !== undefined && val !== null) {
      if (typeof val !== 'string' || !isIsoDateString(val)) {
        errors.push(`Field '${field}' must be a valid ISO-8601 string, received '${val}'`);
      }
    }
  }

  // Window consistency
  if (p.windowStart && p.windowEnd) {
    const start = Date.parse(p.windowStart);
    const end = Date.parse(p.windowEnd);
    if (start > end) {
      errors.push(`windowStart (${p.windowStart}) cannot be later than windowEnd (${p.windowEnd})`);
    }
  }

  // 5. Secret and stack trace leaks check
  const textFieldsToCheck: string[] = [];
  if (p.sourceId) textFieldsToCheck.push(p.sourceId);
  if (p.sourceType) textFieldsToCheck.push(p.sourceType);
  if (p.fixtureVersion) textFieldsToCheck.push(p.fixtureVersion);
  if (Array.isArray(p.caveats)) {
    for (const c of p.caveats) {
      if (typeof c === 'string') textFieldsToCheck.push(c);
    }
  }

  for (const text of textFieldsToCheck) {
    if (containsSecretOrTrace(text)) {
      errors.push(`Provenance field contains potential secret, credential, or stack trace: '${text.substring(0, 30)}...'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Factory for creating verified live provenance
 */
export function createLiveProvenance(params: {
  sourceId: string;
  sourceType: string;
  observedAt?: string;
  fetchedAt?: string;
  caveats?: string[];
}): DashboardProvenance {
  const prov: DashboardProvenance = {
    mode: 'live',
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    observedAt: params.observedAt,
    fetchedAt: params.fetchedAt,
    caveats: params.caveats,
  };
  const val = validateProvenance(prov);
  if (!val.valid) {
    throw new Error(`Invalid live provenance: ${val.errors.join('; ')}`);
  }
  return prov;
}

/**
 * Factory for creating verified derived provenance
 */
export function createDerivedProvenance(params: {
  sourceId?: string;
  sourceType?: string;
  windowStart?: string;
  windowEnd?: string;
  calculatedAt?: string;
  caveats?: string[];
}): DashboardProvenance {
  const prov: DashboardProvenance = {
    mode: 'derived',
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    windowStart: params.windowStart,
    windowEnd: params.windowEnd,
    calculatedAt: params.calculatedAt,
    caveats: params.caveats,
  };
  const val = validateProvenance(prov);
  if (!val.valid) {
    throw new Error(`Invalid derived provenance: ${val.errors.join('; ')}`);
  }
  return prov;
}

/**
 * Factory for creating verified manual provenance
 */
export function createManualProvenance(params: {
  sourceId: string;
  observedAt?: string;
  caveats?: string[];
}): DashboardProvenance {
  const prov: DashboardProvenance = {
    mode: 'manual',
    sourceId: params.sourceId,
    sourceType: 'manual_input',
    observedAt: params.observedAt,
    caveats: params.caveats,
  };
  const val = validateProvenance(prov);
  if (!val.valid) {
    throw new Error(`Invalid manual provenance: ${val.errors.join('; ')}`);
  }
  return prov;
}

/**
 * Factory for creating verified demo provenance
 */
export function createDemoProvenance(params: {
  fixtureVersion: string;
  sourceId?: string;
  observedAt?: string;
  caveats?: string[];
}): DashboardProvenance {
  const prov: DashboardProvenance = {
    mode: 'demo',
    fixtureVersion: params.fixtureVersion,
    sourceId: params.sourceId || 'demo_fixture',
    sourceType: 'fixture',
    observedAt: params.observedAt,
    caveats: params.caveats,
  };
  const val = validateProvenance(prov);
  if (!val.valid) {
    throw new Error(`Invalid demo provenance: ${val.errors.join('; ')}`);
  }
  return prov;
}
