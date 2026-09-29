import { Module } from '@nestjs/common';
import { IotModule } from '../iot/iot.module';
import { DashboardIotController } from './dashboard-iot.controller';
import { DashboardWaterController } from './dashboard-water.controller';
import { DashboardEnvironmentController } from './dashboard-environment.controller';
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';
import { DashboardIotTelemetryService } from './dashboard-iot-telemetry.service';
import { DashboardWaterService } from './dashboard-water.service';
import { DashboardEnvironmentService } from './dashboard-environment.service';

import { DashboardAlertController } from './alerts/dashboard-alert.controller';
import { DashboardAlertStatusService } from './alerts/dashboard-alert-status.service';
import { AlertRuleRegistry } from './alerts/alert-rule-registry';

@Module({
  imports: [IotModule],
  controllers: [
    DashboardIotController,
    DashboardWaterController,
    DashboardEnvironmentController,
    DashboardAlertController,
  ],
  providers: [
    DashboardIotCatalogueService,
    DashboardIotTelemetryService,
    DashboardWaterService,
    DashboardEnvironmentService,
    DashboardAlertStatusService,
    AlertRuleRegistry,
  ],
  exports: [
    DashboardIotCatalogueService,
    DashboardIotTelemetryService,
    DashboardWaterService,
    DashboardEnvironmentService,
    DashboardAlertStatusService,
    AlertRuleRegistry,
  ],
})
export class DashboardModule {}

