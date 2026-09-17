import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../../../.env.phase04.local');
dotenv.config({ path: envPath });

import { AppModule } from '../../app.module';

import { CatalogueImporterService } from '../catalogue-importer.service';
import { getFixtureScenario } from '../fixture-scenarios';

async function runFixtureImport() {
  const args = process.argv.slice(2);
  let scenario = 'initial';

  for (const arg of args) {
    if (arg.startsWith('--scenario=')) {
      scenario = arg.split('=')[1];
    }
  }

  console.log(`Starting fixture import for scenario: '${scenario}'...`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const importer = app.get(CatalogueImporterService);
    const batch = getFixtureScenario(scenario);
    const result = await importer.importBatch(batch);
    console.log(`Fixture import finished successfully:`, result);
  } catch (err) {
    console.error('Fixture import failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runFixtureImport();
