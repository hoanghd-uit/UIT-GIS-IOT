import { Module } from '@nestjs/common';
import { IotClientService } from './services/iot-client.service';
import { IotMapperService } from './services/iot-mapper.service';
import { IotTelemetryService } from './services/iot-telemetry.service';
import { IotService } from './iot.service';
import { DisabledCatalogueProvider } from './providers/disabled-catalogue.provider';

@Module({
  providers: [
    IotClientService,
    IotMapperService,
    IotTelemetryService,
    IotService,
    {
      provide: 'DEVICE_CATALOGUE_PROVIDER',
      useClass: DisabledCatalogueProvider,
    },
  ],
  exports: [
    IotService,
    IotClientService,
    IotMapperService,
    IotTelemetryService,
    'DEVICE_CATALOGUE_PROVIDER',
  ],
})
export class IotModule {}

