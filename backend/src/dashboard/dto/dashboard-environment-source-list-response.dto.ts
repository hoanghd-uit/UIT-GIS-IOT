import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardDeviceSourceLocationDto } from './dashboard-device-catalogue-response.dto';

export class DashboardEnvironmentProvenanceDto {
  @ApiProperty({ example: 'live', enum: ['live'] })
  mode: 'live';

  @ApiProperty({ example: 'iot_backend_catalogue' })
  sourceType: string;

  @ApiProperty({ example: '2026-09-27T12:00:00.000Z', description: 'Application backend fetch timestamp (ISO-8601)' })
  fetchedAt: string;

  @ApiPropertyOptional({ type: [String] })
  caveats?: string[];
}

export class DashboardEnvironmentSourceSummaryDto {
  @ApiProperty({ example: 4, description: 'Raw candidate records received from upstream catalogue' })
  receivedCount: number;

  @ApiProperty({ example: 4, description: 'Valid solar records accepted into environment source list' })
  acceptedSolarCount: number;

  @ApiProperty({ example: 1, description: 'Valid SB records accepted into environment source list' })
  acceptedSbCount: number;

  @ApiProperty({ example: 0, description: 'Malformed records skipped' })
  skippedCount: number;

  @ApiProperty({ example: 0, description: 'Duplicate device IDs skipped' })
  duplicateCount: number;

  @ApiProperty({ example: false, nullable: true, description: 'Upstream truncation indicator' })
  truncated: boolean | null;
}

export class DashboardEnvironmentSourceItemDto {
  @ApiProperty({ example: '8cf95720000a0123', description: 'Opaque upstream device identifier' })
  deviceId: string;

  @ApiProperty({ example: 'solar', enum: ['solar', 'sb'], description: 'Authoritative source device type' })
  sourceDeviceType: 'solar' | 'sb';

  @ApiProperty({ example: true, description: 'Catalogue registration/activity metadata (NOT online/offline health)' })
  catalogueActive: boolean;

  @ApiPropertyOptional({ example: '2026-09-20T19:09:17.355Z', description: 'Source record creation timestamp' })
  sourceCreatedAt: string | null;

  @ApiPropertyOptional({ example: '2026-09-20T19:09:17.355Z', description: 'Source metadata update timestamp' })
  sourceUpdatedAt: string | null;

  @ApiProperty({ type: DashboardDeviceSourceLocationDto })
  sourceLocation: DashboardDeviceSourceLocationDto;

  @ApiProperty({ example: '4', nullable: true, description: 'Viewer display floor ID, or null if unmapped' })
  displayFloorId: string | null;

  @ApiProperty({
    example: 'source',
    enum: ['source', 'development-fallback', 'unmapped'],
    description: 'Floor assignment provenance',
  })
  floorAssignment: 'source' | 'development-fallback' | 'unmapped';

  @ApiProperty({
    example: 'unconfirmed_environment_candidate',
    enum: ['unconfirmed_environment_candidate'],
    description: 'Environmental semantic confirmation status',
  })
  semanticStatus: 'unconfirmed_environment_candidate';

  @ApiPropertyOptional({
    type: [String],
    example: ['temperature', 'humidity', 'lux'],
    description: 'Supported environmental metrics by source device type',
  })
  supportedMetrics?: string[];
}

export class DashboardEnvironmentSourceListResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: '4', nullable: true })
  requestedFloorId: string | null;

  @ApiProperty({ example: 'ready', enum: ['ready', 'empty'] })
  availability: 'ready' | 'empty';

  @ApiProperty({ type: DashboardEnvironmentProvenanceDto })
  provenance: DashboardEnvironmentProvenanceDto;

  @ApiProperty({ type: DashboardEnvironmentSourceSummaryDto })
  summary: DashboardEnvironmentSourceSummaryDto;

  @ApiProperty({ type: [DashboardEnvironmentSourceItemDto] })
  sources: DashboardEnvironmentSourceItemDto[];
}
