import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceBindingEntity } from '../database/entities/device-binding.entity';
import { DeviceDisplayOverrideEntity } from '../database/entities/device-display-override.entity';
import { CatalogueSyncStateEntity } from '../database/entities/catalogue-sync-state.entity';
import { FloorEntity } from '../database/entities/floor.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceBindingEntity,
      DeviceDisplayOverrideEntity,
      CatalogueSyncStateEntity,
      FloorEntity,
    ]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}

