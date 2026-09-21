export interface AppConfig {
  env: string;
  host: string;
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password?: string;
  };
  fixtures: {
    mode: 'disabled' | 'fixture' | 'iot';
    allowFixtures: boolean;
    namespace: string;
    enableLocalPositionEditing: boolean;
  };
  iot: {
    baseUrl: string;
    masterToken: string;
    timeoutMs: number;
    floorMode: string;
    coordinateMode: string;
  };
}

export default (): AppConfig => {
  const mode = (process.env.DEVICE_SOURCE_MODE || 'disabled') as 'disabled' | 'fixture' | 'iot';
  const allowFixtures = process.env.ALLOW_FIXTURES === 'true';
  const env = process.env.APP_ENV || 'local';

  // Guard against unsafe configurations
  if (mode === 'fixture' && env !== 'local' && env !== 'test') {
    throw new Error(`DEVICE_SOURCE_MODE=fixture is only permitted in local or test environments (current: ${env})`);
  }

  if (mode === 'fixture' && !allowFixtures) {
    throw new Error('DEVICE_SOURCE_MODE=fixture requires ALLOW_FIXTURES=true');
  }

  return {
    env,
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT || '3001', 10),
    database: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME || 'gis_uit_dev',
      user: process.env.DB_APP_USER || 'gis_app_runtime',
      password: process.env.DB_APP_PASSWORD,
    },
    fixtures: {
      mode,
      allowFixtures,
      namespace: process.env.DEVICE_SOURCE_NAMESPACE || 'phase04-fixture-v1',
      enableLocalPositionEditing: process.env.ENABLE_LOCAL_POSITION_EDITING === 'true',
    },
    iot: {
      baseUrl: process.env.IOT_API_BASE_URL || 'https://api.ttlab.manhthao.uk',
      masterToken: process.env.IOT_API_MASTER_TOKEN || '',
      timeoutMs: parseInt(process.env.IOT_API_TIMEOUT_MS || '10000', 10),
      floorMode: process.env.IOT_FLOOR_MAPPING_MODE || 'TEST_CURRENT_FLOOR_4_6_V1',
      coordinateMode: process.env.IOT_COORDINATE_MAPPING_MODE || 'TEST_PREFAB_CENTER_XZ_V1',
    },
  };
};

