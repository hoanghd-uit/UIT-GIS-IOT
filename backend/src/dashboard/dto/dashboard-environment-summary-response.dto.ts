import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardEnvironmentSummaryQueryRangeDto {
  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  start: string;

  @ApiProperty({ example: '2026-09-27T12:00:00.000Z' })
  stop: string;

  @ApiProperty({ example: 1, default: 1 })
  limitPerSource: 1;
}

export class DashboardEnvironmentSummaryProvenanceDto {
  @ApiProperty({ example: 'derived', enum: ['derived'] })
  mode: 'derived';

  @ApiProperty({ example: 'iot_backend_solar' })
  sourceType: string;

  @ApiProperty({ example: 'latest_sample_population_summary_v1' })
  calculation: string;

  @ApiProperty({ example: '2026-09-27T12:00:00.000Z', description: 'Upstream fetch timestamp' })
  fetchedAt: string;

  @ApiProperty({ example: '2026-09-27T12:00:00.050Z', description: 'Summary calculation timestamp' })
  calculatedAt: string;

  @ApiProperty({ type: [String] })
  caveats: string[];
}

export class DashboardEnvironmentSummaryCoverageDto {
  @ApiProperty({ example: 4, description: 'Total Solar devices found in catalogue' })
  catalogueSolarCount: number;

  @ApiPropertyOptional({ example: 1, description: 'Total SB devices found in catalogue' })
  catalogueSbCount?: number;

  @ApiProperty({ example: 4, description: 'Number of devices attempted for history fetch (capped at 20)' })
  attemptedSourceCount: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of Solar devices attempted for history fetch' })
  attemptedSolarCount?: number;

  @ApiPropertyOptional({ example: 1, description: 'Number of SB devices attempted for history fetch' })
  attemptedSbCount?: number;

  @ApiProperty({ example: 4, description: 'Sources that returned at least one valid reading in the window' })
  successfulSourceCount: number;

  @ApiProperty({ example: 0, description: 'Sources that had zero readings in the window' })
  emptySourceCount: number;

  @ApiProperty({ example: 0, description: 'Sources that failed with an error or timeout' })
  failedSourceCount: number;

  @ApiProperty({ example: false, description: 'True if catalogue had more than 20 candidate sources' })
  sourcesTruncated: boolean;

  @ApiPropertyOptional({ example: 'type_interleaving_v1', description: 'Fair interleaving selection policy version' })
  selectionPolicy?: string;
}

export class DashboardEnvironmentMetricSummaryDto {
  @ApiProperty({ example: 25.8, nullable: true })
  mean: number | null;

  @ApiProperty({ example: 24.1, nullable: true })
  min: number | null;

  @ApiProperty({ example: 27.5, nullable: true })
  max: number | null;

  @ApiProperty({ example: 4, description: 'Number of distinct sources contributing to this metric' })
  contributingSourceCount: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  unit: string | null;

  @ApiPropertyOptional({ example: 'documented_contract' })
  semanticStatus?: string;

  @ApiPropertyOptional({ example: '2026-09-27T11:58:30.000Z', nullable: true, description: 'Latest observed timestamp for this specific metric' })
  observedAt?: string | null;
}

export class DashboardEnvironmentSummaryMetricsDto {
  @ApiProperty({ type: DashboardEnvironmentMetricSummaryDto })
  rawTemperature: DashboardEnvironmentMetricSummaryDto;

  @ApiProperty({ type: DashboardEnvironmentMetricSummaryDto })
  rawHumidity: DashboardEnvironmentMetricSummaryDto;

  @ApiProperty({ type: DashboardEnvironmentMetricSummaryDto })
  lux: DashboardEnvironmentMetricSummaryDto;

  @ApiPropertyOptional({ type: DashboardEnvironmentMetricSummaryDto })
  co2?: DashboardEnvironmentMetricSummaryDto;
}

export class DashboardEnvironmentSourceResultDto {
  @ApiProperty({ example: '8cf95720000a0123' })
  deviceId: string;

  @ApiPropertyOptional({ example: 'solar', enum: ['solar', 'sb'] })
  sourceDeviceType?: 'solar' | 'sb';

  @ApiProperty({ example: 'ready', enum: ['ready', 'empty', 'error'] })
  status: 'ready' | 'empty' | 'error';

  @ApiProperty({ example: '2026-09-27T11:58:30.000Z', nullable: true })
  observedAt: string | null;

  @ApiPropertyOptional({ example: 596, nullable: true, description: 'Latest finite CO2 sample if source is SB' })
  co2?: number | null;
}

export class DashboardEnvironmentSummaryResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: 'ready', enum: ['ready', 'partial', 'empty'] })
  availability: 'ready' | 'partial' | 'empty';

  @ApiProperty({ type: DashboardEnvironmentSummaryQueryRangeDto })
  queryRange: DashboardEnvironmentSummaryQueryRangeDto;

  @ApiProperty({ type: DashboardEnvironmentSummaryProvenanceDto })
  provenance: DashboardEnvironmentSummaryProvenanceDto;

  @ApiProperty({ type: DashboardEnvironmentSummaryCoverageDto })
  coverage: DashboardEnvironmentSummaryCoverageDto;

  @ApiProperty({ type: DashboardEnvironmentSummaryMetricsDto })
  metrics: DashboardEnvironmentSummaryMetricsDto;

  @ApiProperty({ example: '2026-09-27T11:58:30.000Z', nullable: true })
  latestObservedAt: string | null;

  @ApiProperty({ type: [DashboardEnvironmentSourceResultDto] })
  sourceResults: DashboardEnvironmentSourceResultDto[];
}
