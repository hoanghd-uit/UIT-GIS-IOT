/**
 * Dashboard Foundation and Provenance Contracts
 * Big Phase 02 — Sub-phase 01
 */

/**
 * Shared Data Mode Contract
 * live: Real data read from an approved source through the application backend
 * derived: Data calculated by the application from real/report data
 * manual: Application-owned data entered or edited by an authorized user
 * demo: Deterministic fixture data used intentionally for demonstration
 */
export type DashboardDataMode = 'live' | 'derived' | 'manual' | 'demo';

/**
 * Shared Availability State Contract
 * Separate from origin/mode.
 */
export type DashboardAvailability = 'ready' | 'empty' | 'unavailable' | 'error';

/**
 * Compact Shared Provenance Interface
 */
export interface DashboardProvenance {
  /** Origin data mode */
  mode: DashboardDataMode;
  /** Stable source identifier or device/subsystem ID */
  sourceId?: string;
  /** Stable source type or subsystem name */
  sourceType?: string;
  /** Observation or sample time (ISO-8601 string) */
  observedAt?: string;
  /** Source window start timestamp (ISO-8601 string) */
  windowStart?: string;
  /** Source window stop timestamp (ISO-8601 string) */
  windowEnd?: string;
  /** Application backend fetch timestamp (ISO-8601 string) */
  fetchedAt?: string;
  /** Application calculation timestamp (ISO-8601 string) */
  calculatedAt?: string;
  /** Fixture version identifier (REQUIRED when mode === 'demo', FORBIDDEN when mode === 'live') */
  fixtureVersion?: string;
  /** Human-readable caveats, quality notes, or limitations */
  caveats?: string[];
}

/**
 * In-scope Dashboard Page Identifiers
 * Strictly Pages 01, 02, 03, 06, 07, 09, 11
 */
export type DashboardPageId =
  | 'overview'
  | 'energy-water'
  | 'environment'
  | 'alerts'
  | 'iot'
  | 'parking'
  | 'fire-safety';

export type DashboardPageNumber = '01' | '02' | '03' | '06' | '07' | '09' | '11';

/**
 * Dashboard Navigation Route Item
 */
export interface DashboardRouteItem {
  id: DashboardPageId;
  pageNumber: DashboardPageNumber;
  title: string;
  shortTitle: string;
  path: string;
  description: string;
  expectedMode: DashboardDataMode;
}
