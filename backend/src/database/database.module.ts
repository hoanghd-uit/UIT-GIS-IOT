import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FloorEntity } from './entities/floor.entity';
import { DeviceBindingEntity } from './entities/device-binding.entity';
import { DeviceDisplayOverrideEntity } from './entities/device-display-override.entity';
import { CatalogueSyncStateEntity } from './entities/catalogue-sync-state.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        entities: [
          FloorEntity,
          DeviceBindingEntity,
          DeviceDisplayOverrideEntity,
          CatalogueSyncStateEntity,
        ],
        synchronize: false,
        logging: config.get<string>('env') === 'local' ? ['error', 'warn'] : false,
      }),
    }),
    TypeOrmModule.forFeature([
      FloorEntity,
      DeviceBindingEntity,
      DeviceDisplayOverrideEntity,
      CatalogueSyncStateEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

