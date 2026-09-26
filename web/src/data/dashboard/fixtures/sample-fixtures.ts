import { defineDashboardFixture } from '@/lib/dashboard/fixtures';

/**
 * Sample Trend Data for MetricTrendChart tests and fixtures
 */
export interface TrendDataPoint {
  timestamp: string;
  value: number;
  category?: string;
}

export const SAMPLE_TREND_FIXTURE_V1 = defineDashboardFixture<TrendDataPoint[]>({
  fixtureId: 'sample-trend-fixture',
  fixtureVersion: '1.0.0',
  validFrom: '2026-09-26T00:00:00.000Z',
  scenarioDescription: 'Dữ liệu mẫu kiểm thử biểu đồ đường xu hướng 24h',
  data: [
    { timestamp: '2026-09-26T00:00:00.000Z', value: 42.5 },
    { timestamp: '2026-09-26T04:00:00.000Z', value: 38.2 },
    { timestamp: '2026-09-26T08:00:00.000Z', value: 65.4 },
    { timestamp: '2026-09-26T12:00:00.000Z', value: 78.1 },
    { timestamp: '2026-09-26T16:00:00.000Z', value: 71.9 },
    { timestamp: '2026-09-26T20:00:00.000Z', value: 54.0 },
  ],
});

/**
 * Sample Bar Data for MetricBarChart tests and fixtures
 */
export interface BarDataPoint {
  category: string;
  value: number;
  series?: string;
}

export const SAMPLE_BAR_FIXTURE_V1 = defineDashboardFixture<BarDataPoint[]>({
  fixtureId: 'sample-bar-fixture',
  fixtureVersion: '1.0.0',
  validFrom: '2026-09-26T00:00:00.000Z',
  scenarioDescription: 'Dữ liệu mẫu kiểm thử biểu đồ cột phân loại tiêu thụ',
  data: [
    { category: 'Tầng 1', value: 120 },
    { category: 'Tầng 2', value: 240 },
    { category: 'Tầng 3', value: 180 },
    { category: 'Tầng 4', value: 310 },
    { category: 'Tầng 5', value: 290 },
  ],
});

/**
 * Sample Distribution Data for MetricDistributionChart tests and fixtures
 */
export interface DistributionDataPoint {
  type: string;
  value: number;
}

export const SAMPLE_DISTRIBUTION_FIXTURE_V1 = defineDashboardFixture<DistributionDataPoint[]>({
  fixtureId: 'sample-distribution-fixture',
  fixtureVersion: '1.0.0',
  validFrom: '2026-09-26T00:00:00.000Z',
  scenarioDescription: 'Dữ liệu mẫu kiểm thử biểu đồ phân bổ tỷ lệ phần trăm',
  data: [
    { type: 'Chiếu sáng', value: 35 },
    { type: 'Điều hòa nhiệt độ (HVAC)', value: 45 },
    { type: 'Thiết bị ổ cắm', value: 15 },
    { type: 'Khác', value: 5 },
  ],
});
