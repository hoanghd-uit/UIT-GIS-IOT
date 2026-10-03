import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PasswordHasherService } from '../password-hasher.service';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../../../.env.phase04.local');
dotenv.config({ path: envPath });

interface SeedAccountSpec {
  username: string;
  role: 'viewer' | 'manager';
  defaultPasswordEnvKey: string;
  fallbackPassword: string;
}

const TARGET_ACCOUNTS: SeedAccountSpec[] = [
  {
    username: 'beiviewer',
    role: 'viewer',
    defaultPasswordEnvKey: 'AUTH_SEED_VIEWER_PASSWORD',
    fallbackPassword: 'bei1234',
  },
  {
    username: 'beimanager',
    role: 'manager',
    defaultPasswordEnvKey: 'AUTH_SEED_MANAGER_PASSWORD',
    fallbackPassword: 'bei1234',
  },
];

export async function seedLocalAccounts() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.POSTGRES_DB || 'gis_uit_dev';
  const appUser = process.env.DB_APP_USER || 'gis_app_runtime';
  const appPassword = process.env.DB_APP_PASSWORD;

  console.log(`[AUTH-SEED] Starting local account seeding on ${database} (${host}:${port})...`);

  const client = new Client({
    host,
    port,
    database,
    user: appUser,
    password: appPassword,
  });

  const hasher = new PasswordHasherService();

  try {
    await client.connect();

    for (const spec of TARGET_ACCOUNTS) {
      const normalizedUsername = spec.username.trim().toLowerCase();
      const initialPassword = process.env[spec.defaultPasswordEnvKey] || spec.fallbackPassword;

      // 1. Query existing account
      const checkRes = await client.query(
        `SELECT id, username, role, is_active FROM application_users WHERE username = $1`,
        [normalizedUsername],
      );

      if (checkRes.rows.length > 0) {
        const existing = checkRes.rows[0];
        if (existing.role !== spec.role) {
          console.error(
            `[AUTH-SEED] CONFLICT: Existing account '${normalizedUsername}' has role '${existing.role}', but expected role is '${spec.role}'. Aborting to prevent silent mutation.`,
          );
          process.exitCode = 1;
          return;
        }

        console.log(
          `[AUTH-SEED] Existing account '${normalizedUsername}' confirmed with matching role '${spec.role}' (active: ${existing.is_active}). Preserving existing credentials.`,
        );
      } else {
        // Account does not exist, hash password and insert
        const passwordHash = await hasher.hash(initialPassword);
        const insertRes = await client.query(
          `INSERT INTO application_users (username, password_hash, role, is_active)
           VALUES ($1, $2, $3, true)
           RETURNING id, username, role, is_active`,
          [normalizedUsername, passwordHash, spec.role],
        );
        const created = insertRes.rows[0];
        console.log(
          `[AUTH-SEED] Created new account '${created.username}' with role '${created.role}' (id: ${created.id}). Salted hash generated securely.`,
        );
      }
    }

    console.log('[AUTH-SEED] Local account seeding completed successfully.');
  } catch (error) {
    console.error('[AUTH-SEED] Error seeding local accounts:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedLocalAccounts();
}
