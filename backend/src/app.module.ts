import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { FloorsModule } from './floors/floors.module';
import { DevicesModule } from './devices/devices.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { IotModule } from './iot/iot.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    HealthModule,
    FloorsModule,
    DevicesModule,
    FixturesModule,
    IotModule,
    DashboardModule,
  ],
})
export class AppModule {}

