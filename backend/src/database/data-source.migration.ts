import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { FloorEntity } from './entities/floor.entity';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../../.env.phase04.local');
dotenv.config({ path: envPath });

import { DeviceBindingEntity } from './entities/device-binding.entity';
import { DeviceDisplayOverrideEntity } from './entities/device-display-override.entity';
import { CatalogueSyncStateEntity } from './entities/catalogue-sync-state.entity';
import { InitialDeviceTables1726560000000 } from './migrations/1726560000000-InitialDeviceTables';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'gis_uit_dev',
  username: process.env.DB_MIGRATION_USER || 'gis_migration_owner',
  password: process.env.DB_MIGRATION_PASSWORD,
  entities: [
    FloorEntity,
    DeviceBindingEntity,
    DeviceDisplayOverrideEntity,
    CatalogueSyncStateEntity,
  ],
  migrations: [InitialDeviceTables1726560000000],
  synchronize: false,
});
