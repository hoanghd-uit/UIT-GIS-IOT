import { Module } from '@nestjs/common';
import { IotModule } from '../iot/iot.module';
import { DashboardIotController } from './dashboard-iot.controller';
import { DashboardWaterController } from './dashboard-water.controller';
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';
import { DashboardIotTelemetryService } from './dashboard-iot-telemetry.service';
import { DashboardWaterService } from './dashboard-water.service';

@Module({
  imports: [IotModule],
  controllers: [DashboardIotController, DashboardWaterController],
  providers: [
    DashboardIotCatalogueService,
    DashboardIotTelemetryService,
    DashboardWaterService,
  ],
  exports: [
    DashboardIotCatalogueService,
    DashboardIotTelemetryService,
    DashboardWaterService,
  ],
})
export class DashboardModule {}

