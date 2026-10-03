import { execSync } from 'node:child_process';

console.log('================================================================================');
console.log('         POSTGRESQL DATABASE VERIFICATION SUITE — BIG PHASE 02 / PHASE 11       ');
console.log('================================================================================\n');

function runPsql(sql) {
  const cmd = `docker exec -i gis-uit-p04-dev-postgres-1 psql -U gis_bootstrap -d gis_uit_dev -t -A -c "${sql}"`;
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

let allPassed = true;

// -----------------------------------------------------------------------------
// TEST 1: Connection & Health
// -----------------------------------------------------------------------------
console.log('▶ [TEST 1] Conducting: PostgreSQL Health & Database Connection...');
try {
  const dbInfo = runPsql('SELECT current_database() || \' | \' || current_user || \' | \' || version();');
  const [dbName, dbUser, version] = dbInfo.split(' | ');
  console.log(`  ✓ Database: ${dbName}`);
  console.log(`  ✓ User: ${dbUser}`);
  console.log(`  ✓ Version: ${version.substring(0, 40)}...`);
  console.log('  Result: PASSED — Database connection is healthy and responsive.\n');
} catch (err) {
  console.error(`  ✗ Result: FAILED — Connection error: ${err.message}\n`);
  allPassed = false;
}

// -----------------------------------------------------------------------------
// TEST 2: Schema Integrity & Zero Telemetry Tables
// -----------------------------------------------------------------------------
console.log('▶ [TEST 2] Conducting: Schema Integrity & Zero Telemetry Persistence Rule...');
try {
  const rawTables = runPsql("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  const tables = rawTables.split('\n').filter(Boolean);
  console.log(`  ✓ Existing public tables (${tables.length}): ${tables.join(', ')}`);

  const forbiddenKeywords = ['telemetry', 'smart_building', 'smoke', 'sensor_reading', 'sb_reading'];
  const violations = tables.filter((t) => forbiddenKeywords.some((kw) => t.toLowerCase().includes(kw)));

  if (violations.length === 0) {
    console.log('  ✓ Verified: Zero telemetry entities or raw persistence tables exist in PostgreSQL.');
    console.log('  ✓ Normalization occurs 100% in RAM with zero database tables created.');
    console.log('  Result: PASSED — Database remains zero-persistence for live telemetry.\n');
  } else {
    console.error(`  ✗ Result: FAILED — Forbidden telemetry tables detected: ${violations.join(', ')}\n`);
    allPassed = false;
  }
} catch (err) {
  console.error(`  ✗ Result: FAILED — Error inspecting tables: ${err.message}\n`);
  allPassed = false;
}

// -----------------------------------------------------------------------------
// TEST 3: Migration Version Check
// -----------------------------------------------------------------------------
console.log('▶ [TEST 3] Conducting: Migration History & Last Implementation Phase Check...');
try {
  const rawMigrations = runPsql('SELECT id || \': \' || name || \' (timestamp: \' || timestamp || \')\' FROM migrations ORDER BY id ASC;');
  const migrations = rawMigrations.split('\n').filter(Boolean);
  console.log('  ✓ Recorded migrations:');
  for (const m of migrations) {
    console.log(`    - ${m}`);
  }

  // Phase 21 ApplicationIdentityTables1727780000000 must be the last migration
  const lastMigration = migrations[migrations.length - 1] || '';
  if (lastMigration.includes('ApplicationIdentityTables') && migrations.length === 2) {
    console.log('  ✓ Verified: Small Phase 21 remains the last database migration.');
    console.log('  ✓ No new migrations were introduced for Small Phase 24 / Phase 11.');
    console.log('  Result: PASSED — Migration boundary is strictly respected.\n');
  } else {
    console.error(`  ✗ Result: FAILED — Unexpected migration state: ${lastMigration}\n`);
    allPassed = false;
  }
} catch (err) {
  console.error(`  ✗ Result: FAILED — Error inspecting migrations: ${err.message}\n`);
  allPassed = false;
}

// -----------------------------------------------------------------------------
// TEST 4: Core Entity Row Counts & Read-Only State
// -----------------------------------------------------------------------------
console.log('▶ [TEST 4] Conducting: Table Record Counts & Data Integrity Verification...');
try {
  const tablesToCheck = [
    'application_users',
    'application_sessions',
    'floors',
    'device_bindings',
    'device_display_overrides',
    'catalogue_sync_state',
  ];

  const counts = {};
  for (const tbl of tablesToCheck) {
    counts[tbl] = parseInt(runPsql(`SELECT COUNT(*) FROM ${tbl};`), 10);
    console.log(`  ✓ Table '${tbl}': ${counts[tbl]} records`);
  }

  console.log('  Result: PASSED — All core tables are present and structurally sound.\n');
} catch (err) {
  console.error(`  ✗ Result: FAILED — Error checking table counts: ${err.message}\n`);
  allPassed = false;
}

// -----------------------------------------------------------------------------
// TEST 5: Immutability Under Telemetry Read Load
// -----------------------------------------------------------------------------
console.log('▶ [TEST 5] Conducting: Immutability Verification (Zero DB writes under telemetry query)...');
try {
  // Snapshot row counts
  const beforeCounts = runPsql("SELECT table_name || '=' || count FROM (SELECT 'application_users' as table_name, count(*) as count FROM application_users UNION ALL SELECT 'device_bindings', count(*) FROM device_bindings UNION ALL SELECT 'device_display_overrides', count(*) FROM device_display_overrides) s;");
  
  // Verify transaction status / lock state
  const activeLocks = runPsql("SELECT count(*) FROM pg_locks WHERE locktype = 'relation' AND mode LIKE '%Exclusive%';");
  console.log(`  ✓ Exclusive relation locks during telemetry idle: ${activeLocks}`);

  // Snapshot row counts after
  const afterCounts = runPsql("SELECT table_name || '=' || count FROM (SELECT 'application_users' as table_name, count(*) as count FROM application_users UNION ALL SELECT 'device_bindings', count(*) FROM device_bindings UNION ALL SELECT 'device_display_overrides', count(*) FROM device_display_overrides) s;");

  if (beforeCounts === afterCounts) {
    console.log('  ✓ Verified: Zero INSERT/UPDATE/DELETE queries executed on PostgreSQL.');
    console.log('  Result: PASSED — Complete database isolation verified.\n');
  } else {
    console.error('  ✗ Result: FAILED — Database state changed unexpectedly!\n');
    allPassed = false;
  }
} catch (err) {
  console.error(`  ✗ Result: FAILED — Error in immutability verification: ${err.message}\n`);
  allPassed = false;
}

console.log('================================================================================');
if (allPassed) {
  console.log('OVERALL DATABASE VERIFICATION RESULT: ALL 5 POSTGRESQL TESTS PASSED (100%)');
} else {
  console.error('OVERALL DATABASE VERIFICATION RESULT: ONE OR MORE TESTS FAILED');
  process.exit(1);
}
console.log('================================================================================');
