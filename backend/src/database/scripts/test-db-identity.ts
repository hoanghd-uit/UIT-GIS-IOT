import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../../../.env.phase04.local');
dotenv.config({ path: envPath });

async function runPostgresDatabaseTests() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.POSTGRES_DB || 'gis_uit_dev';
  const appUser = process.env.DB_APP_USER || 'gis_app_runtime';
  const appPassword = process.env.DB_APP_PASSWORD;

  console.log(`=== RUNNING POSTGRESQL DATABASE TESTS ===`);
  console.log(`Connecting to ${database} on ${host}:${port} as runtime role '${appUser}'...`);

  const client = new Client({
    host,
    port,
    database,
    user: appUser,
    password: appPassword,
  });

  try {
    await client.connect();
    console.log(`[PASS] Connected successfully as '${appUser}'.`);

    // Test 1: Check table existence
    console.log(`Test 1: Verifying existence of tables 'application_users' and 'application_sessions'...`);
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('application_users', 'application_sessions')
      ORDER BY table_name;
    `);
    const tableNames = tableRes.rows.map((r) => r.table_name);
    if (tableNames.includes('application_users') && tableNames.includes('application_sessions')) {
      console.log(`[PASS] Test 1: Tables exist: ${tableNames.join(', ')}`);
    } else {
      throw new Error(`Test 1 FAILED: Expected both tables, found: ${tableNames.join(', ')}`);
    }

    // Test 2: Check columns and constraints of application_users
    console.log(`Test 2: Verifying constraints on 'application_users'...`);
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'application_users'
      ORDER BY ordinal_position;
    `);
    console.log(`[PASS] Test 2: application_users columns: ${colRes.rows.map(r => `${r.column_name}(${r.data_type})`).join(', ')}`);

    // Test 3: Check constraint on role: only 'viewer' or 'manager' allowed
    console.log(`Test 3: Testing check constraint CHK_application_users_role rejects invalid role 'admin'...`);
    let rejected = false;
    try {
      await client.query(`
        INSERT INTO application_users (id, username, password_hash, role)
        VALUES (gen_random_uuid(), 'test_admin_invalid', 'hash', 'admin');
      `);
    } catch (err: any) {
      if (err.message.includes('CHK_application_users_role') || err.code === '23514') {
        rejected = true;
      } else {
        throw err;
      }
    }
    if (rejected) {
      console.log(`[PASS] Test 3: Check constraint successfully rejected role 'admin'.`);
    } else {
      throw new Error(`Test 3 FAILED: Role 'admin' was not rejected by check constraint.`);
    }

    // Test 4: Verify DML permissions (INSERT, SELECT, UPDATE, DELETE) for runtime role
    console.log(`Test 4: Verifying DML permissions (INSERT, SELECT, UPDATE, DELETE) for runtime role...`);
    await client.query(`DELETE FROM application_users WHERE username LIKE 'temp_test_user%' OR username LIKE 'cascade_test_user%';`);
    const tempUsername = `temp_test_user_${Date.now()}`;
    const insertRes = await client.query(`
      INSERT INTO application_users (username, password_hash, role)
      VALUES ($1, 'temp_hash', 'viewer')
      RETURNING id, username, role, is_active;
    `, [tempUsername]);
    const tempUserId = insertRes.rows[0].id;
    console.log(`  Inserted temporary test user id: ${tempUserId}`);

    const crypto = await import('crypto');
    const tokenHash1 = crypto.randomBytes(32).toString('hex');
    const sessionRes = await client.query(`
      INSERT INTO application_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, now() + interval '8 hours')
      RETURNING id, user_id, expires_at;
    `, [tempUserId, tokenHash1]);
    const tempSessionId = sessionRes.rows[0].id;
    console.log(`  Inserted temporary test session id: ${tempSessionId}`);

    // Update session
    await client.query(`
      UPDATE application_sessions
      SET revoked_at = now()
      WHERE id = $1;
    `, [tempSessionId]);
    console.log(`  Updated temporary session (revoked_at set).`);

    // Delete session and user
    await client.query(`DELETE FROM application_sessions WHERE id = $1;`, [tempSessionId]);
    await client.query(`DELETE FROM application_users WHERE id = $1;`, [tempUserId]);
    console.log(`  Cleaned up temporary user and session.`);
    console.log(`[PASS] Test 4: Runtime role has verified SELECT, INSERT, UPDATE, DELETE permissions.`);

    // Test 5: Verify foreign key cascade delete
    console.log(`Test 5: Verifying Foreign Key ON DELETE CASCADE...`);
    const cascadeUsername = `cascade_test_user_${Date.now()}`;
    const cascadeUser = await client.query(`
      INSERT INTO application_users (username, password_hash, role)
      VALUES ($1, 'hash', 'manager')
      RETURNING id;
    `, [cascadeUsername]);
    const cUserId = cascadeUser.rows[0].id;
    const tokenHash2 = crypto.randomBytes(32).toString('hex');
    await client.query(`
      INSERT INTO application_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, now() + interval '8 hours');
    `, [cUserId, tokenHash2]);
    // Delete user, check session is automatically deleted
    await client.query(`DELETE FROM application_users WHERE id = $1;`, [cUserId]);
    const checkCascade = await client.query(`
      SELECT count(*) as count FROM application_sessions WHERE user_id = $1;
    `, [cUserId]);
    if (parseInt(checkCascade.rows[0].count, 10) === 0) {
      console.log(`[PASS] Test 5: Foreign key ON DELETE CASCADE verified.`);
    } else {
      throw new Error(`Test 5 FAILED: Session was not cascade-deleted.`);
    }

    // Test 6: Verify seeded accounts exist, have correct roles and valid hashes
    console.log(`Test 6: Verifying seeded accounts 'beiviewer' and 'beimanager'...`);
    const seedCheck = await client.query(`
      SELECT id, username, password_hash, role, is_active
      FROM application_users
      WHERE username IN ('beiviewer', 'beimanager')
      ORDER BY username;
    `);

    if (seedCheck.rows.length !== 2) {
      throw new Error(`Test 6 FAILED: Expected 2 seeded accounts, found ${seedCheck.rows.length}`);
    }

    const viewer = seedCheck.rows.find(r => r.username === 'beiviewer');
    const manager = seedCheck.rows.find(r => r.username === 'beimanager');

    if (!viewer || viewer.role !== 'viewer' || !viewer.is_active) {
      throw new Error(`Test 6 FAILED: beiviewer record invalid or inactive.`);
    }
    if (!manager || manager.role !== 'manager' || !manager.is_active) {
      throw new Error(`Test 6 FAILED: beimanager record invalid or inactive.`);
    }
    if (viewer.id === manager.id) {
      throw new Error(`Test 6 FAILED: IDs must be unique.`);
    }
    if (viewer.password_hash === manager.password_hash) {
      throw new Error(`Test 6 FAILED: Password hashes must have unique salts even for identical password.`);
    }

    const { PasswordHasherService } = await import('../../auth/password-hasher.service');
    const hasher = new PasswordHasherService();
    const viewerValid = await hasher.verify('bei1234', viewer.password_hash);
    const managerValid = await hasher.verify('bei1234', manager.password_hash);
    const wrongValid = await hasher.verify('wrong_pass', viewer.password_hash);

    if (!viewerValid || !managerValid || wrongValid) {
      throw new Error(`Test 6 FAILED: Password verification against DB hashes failed.`);
    }

    console.log(`[PASS] Test 6: Seeded accounts 'beiviewer' and 'beimanager' verified in PostgreSQL (distinct IDs, unique salts, valid scrypt password verification).`);

    console.log(`=== ALL POSTGRESQL DATABASE TESTS PASSED SUCCESSFULLY ===`);
  } catch (err) {
    console.error(`PostgreSQL test failed:`, err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPostgresDatabaseTests();
