import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TelemetryCoverageSummary } from '../../iot/dto/iot-telemetry.dto';

export class DashboardWaterReadingRawFlagsDto {
  @ApiProperty({ example: 1, nullable: true, description: 'Valve state code (unconfirmed encoding)' })
  valveOpen: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Leak flag code (unconfirmed encoding)' })
  pipeLeak: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Burst flag code (unconfirmed encoding)' })
  pipeBurst: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Battery low flag code (unconfirmed encoding)' })
  batteryLow: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Frozen flag code (unconfirmed encoding)' })
  frozen: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Tamper flag code (unconfirmed encoding)' })
  tamper: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Reverse flow flag code (unconfirmed encoding)' })
  reverseFlow: number | null;
}

export class DashboardWaterRadioMetadataDto {
  @ApiPropertyOptional({ example: '01ca3fa4', nullable: true, description: 'LoRaWAN session address (dev_addr)' })
  devAddr?: string | null;

  @ApiPropertyOptional({ example: 556, nullable: true, description: 'LoRaWAN uplink frame counter' })
  fcnt?: number | null;

  @ApiPropertyOptional({ example: 'as923_2', nullable: true, description: 'Regional frequency plan' })
  region?: string | null;

  @ApiPropertyOptional({ example: 921400000, nullable: true, description: 'Radio frequency in Hz' })
  frequencyHz?: number | null;

  @ApiPropertyOptional({ example: 7, nullable: true, description: 'Spreading factor' })
  spreadingFactor?: number | null;

  @ApiPropertyOptional({ example: 5, nullable: true, description: 'Data rate' })
  dr?: number | null;
}

export class DashboardWaterReadingItemDto {
  @ApiProperty({ example: '2026-09-26T12:33:14.339Z', description: 'Sample observation timestamp' })
  observedAt: string;

  @ApiProperty({ example: 0, nullable: true, description: 'Instantaneous flow rate in m3/h' })
  instantFlowM3h: number | null;

  @ApiProperty({ example: 16.636, nullable: true, description: 'Forward cumulative volume in m3' })
  forwardVolumeM3: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Reverse cumulative volume in m3' })
  reverseVolumeM3: number | null;

  @ApiProperty({ example: 27, nullable: true, description: 'Measured temperature in degrees Celsius' })
  temperatureC: number | null;

  @ApiProperty({ example: -105, nullable: true, description: 'LoRa RSSI in dBm' })
  rssiDbm: number | null;

  @ApiProperty({ example: 11.75, nullable: true, description: 'LoRa SNR in dB' })
  snrDb: number | null;

  @ApiProperty({ example: '58bf25fffee73060', nullable: true, description: 'Receiving gateway ID' })
  gatewayId: string | null;

  @ApiProperty({ type: DashboardWaterReadingRawFlagsDto })
  rawFlags: DashboardWaterReadingRawFlagsDto;

  @ApiPropertyOptional({ type: DashboardWaterRadioMetadataDto })
  radioMetadata?: DashboardWaterRadioMetadataDto;
}

export class DashboardWaterLatestSampleDto {
  @ApiProperty({ example: '2026-09-26T12:33:14.339Z' })
  observedAt: string;

  @ApiProperty({ example: 'testavc2', nullable: true, description: 'Friendly device name from ChirpStack' })
  deviceName: string | null;

  @ApiProperty({ example: '00000025870203', nullable: true, description: 'Physical meter serial number' })
  meterSerial: string | null;

  @ApiProperty({ example: '58bf25fffee73060', nullable: true })
  gatewayId: string | null;

  @ApiProperty({ example: -105, nullable: true })
  rssiDbm: number | null;

  @ApiProperty({ example: 11.75, nullable: true })
  snrDb: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Latest instantaneous flow in m3/h' })
  instantFlowM3h: number | null;

  @ApiProperty({ example: 16.636, nullable: true, description: 'Latest forward volume counter in m3' })
  forwardVolumeM3: number | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Latest reverse volume counter in m3' })
  reverseVolumeM3: number | null;

  @ApiProperty({ example: 27, nullable: true, description: 'Latest temperature in degrees Celsius' })
  temperatureC: number | null;

  @ApiProperty({ type: DashboardWaterReadingRawFlagsDto })
  rawFlags: DashboardWaterReadingRawFlagsDto;
}

export class DashboardWaterReadingsProvenanceDto {
  @ApiProperty({ example: 'live' })
  mode: 'live';

  @ApiProperty({ example: 'water_readings_8cf9572000149bd3' })
  sourceId: string;

  @ApiProperty({ example: 'iot_backend_avc' })
  sourceType: string;

  @ApiPropertyOptional({ example: '2026-09-26T12:33:14.339Z' })
  observedAt?: string;

  @ApiProperty({ example: '2026-09-25T12:00:00.000Z' })
  windowStart: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  windowEnd: string;

  @ApiProperty({ example: '2026-09-26T12:35:00.000Z' })
  fetchedAt: string;

  @ApiPropertyOptional({ type: [String] })
  caveats?: string[];
}

export class DashboardWaterReadingsQueryRangeDto {
  @ApiProperty({ example: '2026-09-25T12:00:00.000Z' })
  start: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  stop: string;

  @ApiProperty({ example: 1000 })
  limit: number;
}

export class DashboardWaterReadingsResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ example: 'E' })
  buildingId: string;

  @ApiProperty({ example: '8cf9572000149bd3' })
  meterId: string;

  @ApiProperty({ enum: ['ready', 'empty'], example: 'ready' })
  availability: 'ready' | 'empty';

  @ApiProperty({ type: DashboardWaterReadingsProvenanceDto })
  provenance: DashboardWaterReadingsProvenanceDto;

  @ApiProperty({ type: DashboardWaterReadingsQueryRangeDto })
  queryRange: DashboardWaterReadingsQueryRangeDto;

  @ApiProperty()
  coverage: TelemetryCoverageSummary;

  @ApiProperty({ type: DashboardWaterLatestSampleDto, nullable: true })
  latestSample: DashboardWaterLatestSampleDto | null;

  @ApiProperty({ type: [DashboardWaterReadingItemDto] })
  readings: DashboardWaterReadingItemDto[];
}
