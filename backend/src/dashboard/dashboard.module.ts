import { Module } from '@nestjs/common';
import { IotModule } from '../iot/iot.module';
import { DashboardIotController } from './dashboard-iot.controller';
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';
import { DashboardIotTelemetryService } from './dashboard-iot-telemetry.service';

@Module({
  imports: [IotModule],
  controllers: [DashboardIotController],
  providers: [DashboardIotCatalogueService, DashboardIotTelemetryService],
  exports: [DashboardIotCatalogueService, DashboardIotTelemetryService],
})
export class DashboardModule {}
