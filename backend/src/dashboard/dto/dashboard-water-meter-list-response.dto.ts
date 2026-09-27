import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardDeviceSourceLocationDto } from './dashboard-device-catalogue-response.dto';

export class DashboardWaterMeterProvenanceDto {
  @ApiProperty({ example: 'live', enum: ['live'] })
  mode: 'live';

  @ApiProperty({ example: 'dashboard-water-meters' })
  sourceId: string;

  @ApiProperty({ example: 'iot_backend_catalogue' })
  sourceType: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z', description: 'Application backend fetch timestamp (ISO-8601)' })
  fetchedAt: string;

  @ApiPropertyOptional({ type: [String] })
  caveats?: string[];
}

export class DashboardWaterMeterSummaryDto {
  @ApiProperty({ example: 2, description: 'Raw AVC records received from upstream catalogue' })
  receivedCount: number;

  @ApiProperty({ example: 2, description: 'Valid AVC records accepted into water meter list' })
  acceptedCount: number;

  @ApiProperty({ example: 0, description: 'Malformed records skipped' })
  skippedCount: number;

  @ApiProperty({ example: 0, description: 'Duplicate device IDs skipped' })
  duplicateCount: number;

  @ApiProperty({ example: false, nullable: true, description: 'Upstream truncation indicator' })
  truncated: boolean | null;
}

export class DashboardWaterMeterListItemDto {
  @ApiProperty({ example: '8cf9572000149bd3', description: 'Opaque upstream device identifier (query parameter dev_eui)' })
  deviceId: string;

  @ApiProperty({ example: 'avc', enum: ['avc'], description: 'Authoritative source device type' })
  sourceDeviceType: 'avc';

  @ApiProperty({ example: true, description: 'Catalogue registration/activity metadata (NOT online/offline health)' })
  catalogueActive: boolean;

  @ApiProperty({ example: '2026-09-20T19:09:17.355Z', description: 'Source record creation timestamp' })
  sourceCreatedAt: string;

  @ApiProperty({ example: '2026-09-20T19:09:17.355Z', description: 'Source metadata update timestamp (NOT latest reading)' })
  sourceUpdatedAt: string;

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
}

export class DashboardWaterMeterListResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: '4', nullable: true })
  requestedFloorId: string | null;

  @ApiProperty({ example: 'ready', enum: ['ready', 'empty'] })
  availability: 'ready' | 'empty';

  @ApiProperty({ type: DashboardWaterMeterProvenanceDto })
  provenance: DashboardWaterMeterProvenanceDto;

  @ApiProperty({ type: DashboardWaterMeterSummaryDto })
  summary: DashboardWaterMeterSummaryDto;

  @ApiProperty({ type: [DashboardWaterMeterListItemDto] })
  meters: DashboardWaterMeterListItemDto[];
}
