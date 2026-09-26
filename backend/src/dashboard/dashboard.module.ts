import { Module } from '@nestjs/common';
import { IotModule } from '../iot/iot.module';
import { DashboardIotController } from './dashboard-iot.controller';
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';

@Module({
  imports: [IotModule],
  controllers: [DashboardIotController],
  providers: [DashboardIotCatalogueService],
  exports: [DashboardIotCatalogueService],
})
export class DashboardModule {}
