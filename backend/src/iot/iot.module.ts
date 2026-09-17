import { Module } from '@nestjs/common';
import { DisabledCatalogueProvider } from './providers/disabled-catalogue.provider';

@Module({
  providers: [
    {
      provide: 'DEVICE_CATALOGUE_PROVIDER',
      useClass: DisabledCatalogueProvider,
    },
  ],
  exports: ['DEVICE_CATALOGUE_PROVIDER'],
})
export class IotModule {}

