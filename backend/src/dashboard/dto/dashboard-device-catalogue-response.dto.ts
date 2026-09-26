import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceCategory } from '../../iot/dto/iot-devices.dto';

export class DashboardCatalogueProvenanceDto {
  @ApiProperty({ example: 'live', enum: ['live'] })
  mode: 'live';

  @ApiProperty({ example: 'iot-device-catalogue' })
  sourceId: 'iot-device-catalogue';

  @ApiProperty({ example: 'iot_backend' })
  sourceType: 'iot_backend';

  @ApiProperty({ example: '2026-09-26T02:45:00.000Z', description: 'Application backend fetch timestamp (ISO-8601)' })
  fetchedAt: string;

  @ApiPropertyOptional({ type: [String], example: ['Dữ liệu development fallback được áp dụng cho tầng 4'] })
  caveats?: string[];
}

export class DashboardCatalogueMappingDto {
  @ApiProperty({ example: 'TEST_CURRENT_FLOOR_4_6_V1' })
  floorMode: string;

  @ApiProperty({ example: false, description: 'True when development fallback from floor 0 was applied' })
  developmentFallbackApplied: boolean;

  @ApiProperty({ example: 4, nullable: true, description: 'Mapped upstream floor level requested, or null if full catalogue' })
  requestedUpstreamFloorLevel: number | null;
}

export class DashboardCatalogueSummaryDto {
  @ApiProperty({ example: 25, description: 'Raw records received from upstream' })
  receivedCount: number;

  @ApiProperty({ example: 25, description: 'Valid records accepted into catalogue' })
  acceptedCount: number;

  @ApiProperty({ example: 0, description: 'Malformed records skipped' })
  skippedCount: number;

  @ApiProperty({ example: 0, description: 'Duplicate device IDs skipped' })
  duplicateCount: number;

  @ApiProperty({ example: false, nullable: true, description: 'Upstream truncation indicator' })
  truncated: boolean | null;
}

export class DashboardDeviceSourceLocationDto {
  @ApiProperty({ example: 10.5, description: 'Source installation X coordinate' })
  x: number;

  @ApiProperty({ example: 2.1, description: 'Source installation Y coordinate' })
  y: number;

  @ApiProperty({ example: 15.3, description: 'Source installation Z coordinate' })
  z: number;

  @ApiProperty({ example: 4, description: 'Source installation floor level integer' })
  floorLevel: number;
}

export class DashboardDeviceCatalogueItemDto {
  @ApiProperty({ example: '70B3D57ED0073E9D', description: 'Opaque upstream device identifier' })
  externalDeviceId: string;

  @ApiProperty({ example: 'solar', description: 'Raw source device type string' })
  sourceDeviceType: string;

  @ApiProperty({ example: 'solar', description: 'Mapped application device category' })
  category: DeviceCategory;

  @ApiProperty({ example: true, description: 'Catalogue registration/activity metadata (NOT an online/health signal)' })
  active: boolean;

  @ApiProperty({ example: '2026-09-20T19:09:17.355Z', description: 'Source record creation timestamp' })
  sourceCreatedAt: string;

  @ApiProperty({ example: '2026-09-20T19:09:17.355Z', description: 'Source metadata update timestamp (NOT telemetry last-seen)' })
  sourceUpdatedAt: string;

  @ApiProperty({ type: DashboardDeviceSourceLocationDto })
  sourceLocation: DashboardDeviceSourceLocationDto;

  @ApiProperty({ example: '4', nullable: true, description: 'Viewer display floor ID, or null if unmapped' })
  displayFloorId: string | null;

  @ApiProperty({
    example: 'source',
    enum: ['source', 'development-fallback', 'unmapped'],
    description: 'Floor assignment provenance: source, development-fallback, or unmapped',
  })
  floorAssignment: 'source' | 'development-fallback' | 'unmapped';
}

export class DashboardDeviceCatalogueResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: '4', nullable: true })
  requestedFloorId: string | null;

  @ApiProperty({ example: 'ready', enum: ['ready', 'empty'] })
  availability: 'ready' | 'empty';

  @ApiProperty({ type: DashboardCatalogueProvenanceDto })
  provenance: DashboardCatalogueProvenanceDto;

  @ApiProperty({ type: DashboardCatalogueMappingDto })
  mapping: DashboardCatalogueMappingDto;

  @ApiProperty({ type: DashboardCatalogueSummaryDto })
  summary: DashboardCatalogueSummaryDto;

  @ApiProperty({ type: [DashboardDeviceCatalogueItemDto] })
  devices: DashboardDeviceCatalogueItemDto[];
}

export type DashboardDeviceCatalogueItem = DashboardDeviceCatalogueItemDto;
export type DashboardDeviceCatalogueResponse = DashboardDeviceCatalogueResponseDto;
