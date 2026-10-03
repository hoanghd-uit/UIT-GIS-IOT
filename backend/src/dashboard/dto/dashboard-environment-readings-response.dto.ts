import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TelemetryCoverageSummary } from '../../iot/dto/iot-telemetry.dto';

export class DashboardEnvironmentReadingsProvenanceDto {
  @ApiProperty({ example: 'live', enum: ['live'] })
  mode: 'live';

  @ApiProperty({ example: 'environment_readings_8cf95720000a0123' })
  sourceId: string;

  @ApiProperty({ example: 'iot_backend_solar' })
  sourceType: string;

  @ApiPropertyOptional({ example: '2026-09-27T11:58:30.000Z', nullable: true })
  observedAt?: string | null;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  windowStart: string;

  @ApiProperty({ example: '2026-09-27T12:00:00.000Z' })
  windowEnd: string;

  @ApiProperty({ example: '2026-09-27T12:00:00.000Z' })
  fetchedAt: string;

  @ApiProperty({ type: [String] })
  caveats: string[];
}

export class DashboardEnvironmentLatestSampleDto {
  @ApiProperty({ example: '2026-09-27T11:58:30.000Z' })
  observedAt: string;

  @ApiPropertyOptional({ example: 25.8, nullable: true })
  rawTemperature?: number | null;

  @ApiPropertyOptional({ example: 64.2, nullable: true })
  rawHumidity?: number | null;

  @ApiPropertyOptional({ example: 450, nullable: true })
  lux?: number | null;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  currentUa?: number | null;

  @ApiPropertyOptional({ example: 3300, nullable: true })
  rawVoltage?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  rawState?: number | null;

  @ApiPropertyOptional({ example: 'gw-01', nullable: true })
  gatewayId?: string | null;

  @ApiPropertyOptional({ example: -85, nullable: true })
  rssiDbm?: number | null;

  @ApiPropertyOptional({ example: 8.5, nullable: true })
  snrDb?: number | null;

  // Smart Building (SB) fields
  @ApiPropertyOptional({ example: 596, nullable: true, description: 'CO2 in ppm (assumed standard identity)' })
  rawCo2?: number | null;

  @ApiPropertyOptional({ example: 94, nullable: true, description: 'VOC index (dimensionless)' })
  rawVoc?: number | null;

  @ApiPropertyOptional({ example: 32, nullable: true, description: 'Visible channel sensor count' })
  rawVisible?: number | null;

  @ApiPropertyOptional({ example: 17, nullable: true, description: 'Infrared channel sensor count' })
  rawIr?: number | null;

  @ApiPropertyOptional({ example: 'sb-dev2', nullable: true })
  networkDeviceName?: string | null;

  @ApiPropertyOptional({ example: 'app-01', nullable: true })
  applicationId?: string | null;

  @ApiPropertyOptional({ example: 120, nullable: true })
  fCnt?: number | null;
}

export class DashboardEnvironmentReadingItemDto {
  @ApiProperty({ example: '2026-09-27T11:58:30.000Z' })
  observedAt: string;

  @ApiPropertyOptional({ example: 25.8, nullable: true })
  rawTemperature?: number | null;

  @ApiPropertyOptional({ example: 64.2, nullable: true })
  rawHumidity?: number | null;

  @ApiPropertyOptional({ example: 450, nullable: true })
  lux?: number | null;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  currentUa?: number | null;

  @ApiPropertyOptional({ example: 3300, nullable: true })
  rawVoltage?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  rawState?: number | null;

  @ApiPropertyOptional({ example: 'gw-01', nullable: true })
  gatewayId?: string | null;

  @ApiPropertyOptional({ example: -85, nullable: true })
  rssiDbm?: number | null;

  @ApiPropertyOptional({ example: 8.5, nullable: true })
  snrDb?: number | null;

  @ApiPropertyOptional({ example: 120, nullable: true })
  fCnt?: number | null;

  // Smart Building (SB) fields
  @ApiPropertyOptional({ example: 596, nullable: true, description: 'CO2 in ppm (assumed standard identity)' })
  rawCo2?: number | null;

  @ApiPropertyOptional({ example: 94, nullable: true, description: 'VOC index (dimensionless)' })
  rawVoc?: number | null;

  @ApiPropertyOptional({ example: 32, nullable: true, description: 'Visible channel sensor count' })
  rawVisible?: number | null;

  @ApiPropertyOptional({ example: 17, nullable: true, description: 'Infrared channel sensor count' })
  rawIr?: number | null;

  @ApiPropertyOptional({ example: 'sb-dev2', nullable: true })
  networkDeviceName?: string | null;

  @ApiPropertyOptional({ example: 'app-01', nullable: true })
  applicationId?: string | null;
}

export class DashboardEnvironmentReadingsResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: '8cf95720000a0123' })
  sourceId: string;

  @ApiProperty({ example: 'solar', enum: ['solar', 'sb'] })
  sourceDeviceType: 'solar' | 'sb';

  @ApiProperty({ example: 'ready', enum: ['ready', 'empty'] })
  availability: 'ready' | 'empty';

  @ApiProperty({
    example: {
      start: '2026-09-26T12:00:00.000Z',
      stop: '2026-09-27T12:00:00.000Z',
      limit: 1000,
    },
  })
  queryRange: {
    start: string;
    stop: string;
    limit: number;
  };

  @ApiProperty({ type: DashboardEnvironmentReadingsProvenanceDto })
  provenance: DashboardEnvironmentReadingsProvenanceDto;

  @ApiProperty()
  coverage: TelemetryCoverageSummary;

  @ApiProperty({ type: DashboardEnvironmentLatestSampleDto, nullable: true })
  latestSample: DashboardEnvironmentLatestSampleDto | null;

  @ApiProperty({ type: [DashboardEnvironmentReadingItemDto] })
  readings: DashboardEnvironmentReadingItemDto[];
}
