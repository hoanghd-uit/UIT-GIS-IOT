import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TelemetryCoverageSummary,
  SolarTelemetryData,
  AvcTelemetryData,
} from '../../iot/dto/iot-telemetry.dto';

export class DashboardTelemetryProvenanceDto {
  @ApiProperty({ example: 'live' })
  mode: 'live';

  @ApiProperty({ example: 'iot_telemetry_70B3D57ED0073E9D' })
  sourceId: string;

  @ApiProperty({ example: 'iot_backend_telemetry' })
  sourceType: 'iot_backend_telemetry';

  @ApiPropertyOptional({ example: '2026-09-26T12:00:00.000Z' })
  observedAt?: string;

  @ApiProperty({ example: '2026-09-23T12:00:00.000Z' })
  windowStart: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  windowEnd: string;

  @ApiProperty({ example: '2026-09-26T12:00:05.123Z' })
  fetchedAt: string;

  @ApiPropertyOptional({ type: [String] })
  caveats?: string[];
}

export class DashboardTelemetryLatestSampleDto {
  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  observedAt: string;

  @ApiProperty({ example: 'gateway-01', nullable: true })
  gatewayId: string | null;

  @ApiProperty({ example: -85, nullable: true })
  rssiDbm: number | null;

  @ApiProperty({ example: 9.5, nullable: true })
  snrDb: number | null;
}

export class DashboardTelemetryQueryRangeDto {
  @ApiProperty({ example: '2026-09-23T12:00:00.000Z' })
  start: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  stop: string;

  @ApiProperty({ example: 1000 })
  limit: number;
}

export class DashboardDeviceTelemetryResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: '70B3D57ED0073E9D' })
  deviceId: string;

  @ApiProperty({ enum: ['solar', 'avc'], example: 'solar' })
  deviceType: 'solar' | 'avc';

  @ApiProperty({ enum: ['ready', 'empty'], example: 'ready' })
  availability: 'ready' | 'empty';

  @ApiProperty({ type: DashboardTelemetryProvenanceDto })
  provenance: DashboardTelemetryProvenanceDto;

  @ApiProperty({ type: DashboardTelemetryQueryRangeDto })
  queryRange: DashboardTelemetryQueryRangeDto;

  @ApiProperty()
  coverage: TelemetryCoverageSummary;

  @ApiProperty({ type: DashboardTelemetryLatestSampleDto, nullable: true })
  latestSample: DashboardTelemetryLatestSampleDto | null;

  @ApiProperty()
  telemetry: SolarTelemetryData | AvcTelemetryData;
}
