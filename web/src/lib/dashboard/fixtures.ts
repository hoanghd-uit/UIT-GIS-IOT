import { DashboardProvenance } from '@/types/dashboard';
import { createDemoProvenance } from './provenance';

/**
 * Deterministic Dashboard Fixture Container
 */
export interface DashboardFixture<T> {
  readonly fixtureId: string;
  readonly fixtureVersion: string;
  readonly mode: 'demo';
  readonly validFrom: string; // Deterministic ISO-8601 timestamp
  readonly scenarioDescription: string;
  readonly data: T;
}

/**
 * Creates a deterministic DashboardFixture container.
 * Invariant: guarantees determinism (frozen object, no random/time generation).
 */
export function defineDashboardFixture<T>(params: {
  fixtureId: string;
  fixtureVersion: string;
  validFrom: string;
  scenarioDescription: string;
  data: T;
}): DashboardFixture<T> {
  if (!params.fixtureId || !params.fixtureId.trim()) {
    throw new Error('Fixture requires a non-empty fixtureId');
  }
  if (!params.fixtureVersion || !params.fixtureVersion.trim()) {
    throw new Error('Fixture requires a non-empty fixtureVersion');
  }
  if (!params.validFrom || Number.isNaN(Date.parse(params.validFrom))) {
    throw new Error('Fixture requires a valid ISO-8601 validFrom timestamp');
  }

  const fixture: DashboardFixture<T> = Object.freeze({
    fixtureId: params.fixtureId,
    fixtureVersion: params.fixtureVersion,
    mode: 'demo',
    validFrom: params.validFrom,
    scenarioDescription: params.scenarioDescription,
    data: Object.freeze(params.data),
  });

  return fixture;
}

/**
 * Extracts standard DashboardProvenance from a fixture container.
 */
export function getFixtureProvenance<T>(fixture: DashboardFixture<T>): DashboardProvenance {
  return createDemoProvenance({
    fixtureVersion: fixture.fixtureVersion,
    sourceId: fixture.fixtureId,
    observedAt: fixture.validFrom,
    caveats: [`Kịch bản demo: ${fixture.scenarioDescription}`],
  });
}
