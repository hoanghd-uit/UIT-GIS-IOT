import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const candidateEnvPaths = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(__dirname, '../../.env.phase06.local'),
  path.resolve(__dirname, '../../.env.phase04.local'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../../.env.local'),
].filter(Boolean) as string[];

for (const envCandidate of candidateEnvPaths) {
  if (fs.existsSync(envCandidate)) {
    dotenv.config({ path: envCandidate });
    break;
  }
}

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const host = config.get<string>('host', '127.0.0.1');
  const port = config.get<number>('port', 3001);
  const env = config.get<string>('env', 'local');

  // Global pipes & filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GIS-UIT Building E Digital Twin - Backend API')
    .setDescription(
      'Internal API for device catalogue, marker positions, and persistence in Building E.',
    )
    .setVersion('1.0.0')
    .addTag('Health')
    .addTag('Devices')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Export openapi.json in local mode
  if (env === 'local') {
    const outputPath = path.join(__dirname, '..', 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`Exported OpenAPI specification to ${outputPath}`);
  }

  // Enable CORS for Next.js web application
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Expected-Placement-Revision',
      'X-Request-Id',
    ],
  });

  await app.listen(port, host);
  console.log(`GIS-UIT Backend listening on http://${host}:${port}`);
  console.log(`OpenAPI documentation available at http://${host}:${port}/api/docs`);
}

bootstrap();
