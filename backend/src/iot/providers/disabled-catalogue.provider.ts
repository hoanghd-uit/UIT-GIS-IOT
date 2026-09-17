import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DeviceCatalogueProvider,
  NormalizedCatalogueBatch,
} from '../interfaces/catalogue-provider.interface';

@Injectable()
export class DisabledCatalogueProvider implements DeviceCatalogueProvider {
  async fetchFloorCatalogue(): Promise<NormalizedCatalogueBatch> {
    throw new BadRequestException('IOT_NOT_CONFIGURED: Live IoT provider is not configured for this environment');
  }
}

