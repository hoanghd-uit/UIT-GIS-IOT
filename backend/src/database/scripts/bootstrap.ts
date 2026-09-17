import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../../../.env.phase04.local');
dotenv.config({ path: envPath });


async function bootstrapDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.POSTGRES_DB || 'gis_uit_dev';
  const adminUser = process.env.POSTGRES_ADMIN_USER || 'gis_bootstrap';
  const adminPassword = process.env.POSTGRES_ADMIN_PASSWORD;

  const migrationUser = process.env.DB_MIGRATION_USER || 'gis_migration_owner';
  const migrationPassword = process.env.DB_MIGRATION_PASSWORD;

  const appUser = process.env.DB_APP_USER || 'gis_app_runtime';
  const appPassword = process.env.DB_APP_PASSWORD;

  if (!adminPassword || !migrationPassword || !appPassword) {
    console.error('Missing required database passwords in environment.');
    process.exit(1);
  }

  const client = new Client({
    host,
    port,
    database,
    user: adminUser,
    password: adminPassword,
  });

  try {
    await client.connect();
    console.log(`Connected to PostgreSQL as ${adminUser}`);

    // Create or update migration owner role
    const migrationRoleCheck = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`,
      [migrationUser],
    );
    if (migrationRoleCheck.rows.length === 0) {
      await client.query(`CREATE ROLE "${migrationUser}" WITH LOGIN PASSWORD '${migrationPassword.replace(/'/g, "''")}';`);
      console.log(`Created role ${migrationUser}`);
    } else {
      await client.query(`ALTER ROLE "${migrationUser}" WITH PASSWORD '${migrationPassword.replace(/'/g, "''")}';`);
      console.log(`Updated password for existing role ${migrationUser}`);
    }

    // Create or update app runtime role
    const appRoleCheck = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`,
      [appUser],
    );
    if (appRoleCheck.rows.length === 0) {
      await client.query(`CREATE ROLE "${appUser}" WITH LOGIN PASSWORD '${appPassword.replace(/'/g, "''")}';`);
      console.log(`Created role ${appUser}`);
    } else {
      await client.query(`ALTER ROLE "${appUser}" WITH PASSWORD '${appPassword.replace(/'/g, "''")}';`);
      console.log(`Updated password for existing role ${appUser}`);
    }

    // Grant permissions on database
    await client.query(`GRANT CONNECT ON DATABASE "${database}" TO "${migrationUser}";`);
    await client.query(`GRANT CONNECT ON DATABASE "${database}" TO "${appUser}";`);

    // Schema permissions
    await client.query(`GRANT ALL ON SCHEMA public TO "${migrationUser}";`);
    await client.query(`ALTER SCHEMA public OWNER TO "${migrationUser}";`);
    await client.query(`GRANT USAGE ON SCHEMA public TO "${appUser}";`);

    // Existing and future table permissions
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${appUser}";`);
    await client.query(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO "${appUser}";`);

    // Default privileges for objects created by migrationUser
    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE "${migrationUser}" IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${appUser}";
    `);
    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE "${migrationUser}" IN SCHEMA public
      GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO "${appUser}";
    `);

    console.log('Database role bootstrap completed successfully.');
  } catch (error) {
    console.error('Database bootstrap failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

bootstrapDatabase();
