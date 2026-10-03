import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Controller, Post, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
const cookieParser = require('cookie-parser');
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../.env.phase04.local');
dotenv.config({ path: envPath });

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { CsrfGuard } from '../src/auth/csrf.guard';
import { SessionAuthGuard } from '../src/auth/session-auth.guard';
import { PoliciesGuard } from '../src/authorization/policies.guard';
import { RequireAbility } from '../src/authorization/require-ability.decorator';

// Test-only controller to verify Manager vs Viewer future PCCC CRUD authorization policy
@Controller('api/v1/test-pccc')
class TestPcccController {
  @Post('fire-extinguishers')
  @UseGuards(CsrfGuard, SessionAuthGuard, PoliciesGuard)
  @RequireAbility('create', 'FireExtinguisher')
  @HttpCode(HttpStatus.CREATED)
  createExtinguisher() {
    return { success: true, item: 'fire-extinguisher-created' };
  }

  @Delete('fire-extinguishers/:id')
  @UseGuards(CsrfGuard, SessionAuthGuard, PoliciesGuard)
  @RequireAbility('delete', 'FireExtinguisher')
  @HttpCode(HttpStatus.OK)
  deleteExtinguisher() {
    return { success: true, item: 'fire-extinguisher-deleted' };
  }

  @Post('fire-drills')
  @UseGuards(CsrfGuard, SessionAuthGuard, PoliciesGuard)
  @RequireAbility('create', 'FireDrill')
  @HttpCode(HttpStatus.CREATED)
  createDrill() {
    return { success: true, item: 'fire-drill-created' };
  }

  @Delete('fire-drills/:id')
  @UseGuards(CsrfGuard, SessionAuthGuard, PoliciesGuard)
  @RequireAbility('delete', 'FireDrill')
  @HttpCode(HttpStatus.OK)
  deleteDrill() {
    return { success: true, item: 'fire-drill-deleted' };
  }
}

describe('Auth & Authorization Integration (E2E)', () => {
  let app: INestApplication;
  let viewerCookie: string;
  let managerCookie: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestPcccController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. CSRF & Header Controls', () => {
    it('should reject login request when X-BEI-Request header is missing (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({ username: 'beiviewer', password: 'bei1234' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('X-BEI-Request');
    });

    it('should reject login request when Origin is invalid or missing (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://attacker-site.com')
        .send({ username: 'beiviewer', password: 'bei1234' });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Authentication Flow & Credentials', () => {
    it('should reject login with unknown fields (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({ username: 'beiviewer', password: 'bei1234', role: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('property role should not exist');
    });

    it('should reject invalid password with generic 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({ username: 'beiviewer', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Tên đăng nhập hoặc mật khẩu không chính xác.');
    });

    it('should successfully log in beiviewer and return safe DTO + cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({ username: 'beiviewer', password: 'bei1234' });

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id: expect.any(String),
        username: 'beiviewer',
        role: 'viewer',
        displayRole: 'Viewer',
      });
      expect(res.body).toHaveProperty('abilityRules');
      expect(res.body).toHaveProperty('sessionExpiresAt');
      expect(res.body).not.toHaveProperty('sessionSecret');
      expect(res.body).not.toHaveProperty('passwordHash');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.find((c) => c.startsWith('bei_session=')) : cookies;
      expect(cookieStr).toMatch(/bei_session=[0-9a-f]{64};/);
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('SameSite=Lax');

      viewerCookie = cookieStr!.split(';')[0];
    });

    it('should successfully log in beimanager and return manager role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({ username: 'beimanager', password: 'bei1234' });

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id: expect.any(String),
        username: 'beimanager',
        role: 'manager',
        displayRole: 'Manager',
      });

      const cookies = res.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.find((c) => c.startsWith('bei_session=')) : cookies;
      managerCookie = cookieStr!.split(';')[0];
    });
  });

  describe('3. Current User & Session Validation (/auth/me)', () => {
    it('should reject unauthenticated request to /auth/me (401)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return current user for valid viewer session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', viewerCookie);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('beiviewer');
      expect(res.body.user.role).toBe('viewer');
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('should return current user for valid manager session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', managerCookie);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('beimanager');
      expect(res.body.user.role).toBe('manager');
    });
  });

  describe('4. Dashboard Reads Protection', () => {
    it('should reject anonymous access to Dashboard endpoints (401)', async () => {
      const resWater = await request(app.getHttpServer())
        .get('/api/v1/dashboard/buildings/E/water/meters');
      expect(resWater.status).toBe(401);

      const resEnv = await request(app.getHttpServer())
        .get('/api/v1/dashboard/buildings/E/environment/sources');
      expect(resEnv.status).toBe(401);
    });

    it('should allow beiviewer to read Dashboard endpoints (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/buildings/E/environment/sources')
        .set('Cookie', viewerCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('provenance');
    });

    it('should allow beimanager to read Dashboard endpoints (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/buildings/E/environment/sources')
        .set('Cookie', managerCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('provenance');
    });
  });

  describe('5. Legacy Device Placement Mutation Authorization Denial', () => {
    const dummyDeviceId = '00000000-0000-0000-0000-000000000000';

    it('should reject anonymous update to display-position (401)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/devices/${dummyDeviceId}/display-position`)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .set('X-Expected-Placement-Revision', '1')
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          localX: 10,
          localY: 0,
          localZ: 10,
        });

      expect(res.status).toBe(401);
    });

    it('should deny beiviewer update to display-position (403)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/devices/${dummyDeviceId}/display-position`)
        .set('Cookie', viewerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .set('X-Expected-Placement-Revision', '1')
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          localX: 10,
          localY: 0,
          localZ: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Insufficient privileges');
    });

    it('should deny beimanager update to display-position (403)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/devices/${dummyDeviceId}/display-position`)
        .set('Cookie', managerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .set('X-Expected-Placement-Revision', '1')
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          localX: 10,
          localY: 0,
          localZ: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Insufficient privileges');
    });

    it('should deny both roles reset display-position (403)', async () => {
      const resViewer = await request(app.getHttpServer())
        .delete(`/api/v1/devices/${dummyDeviceId}/display-position`)
        .set('Cookie', viewerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .set('X-Expected-Placement-Revision', '1');

      expect(resViewer.status).toBe(403);

      const resManager = await request(app.getHttpServer())
        .delete(`/api/v1/devices/${dummyDeviceId}/display-position`)
        .set('Cookie', managerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .set('X-Expected-Placement-Revision', '1');

      expect(resManager.status).toBe(403);
    });
  });

  describe('6. Future PCCC Policy Verification (Manager vs Viewer)', () => {
    it('should deny beiviewer create and delete on FireExtinguisher (403)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/test-pccc/fire-extinguishers')
        .set('Cookie', viewerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({});

      expect(createRes.status).toBe(403);

      const deleteRes = await request(app.getHttpServer())
        .delete('/api/v1/test-pccc/fire-extinguishers/fe-1')
        .set('Cookie', viewerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000');

      expect(deleteRes.status).toBe(403);
    });

    it('should allow beimanager create and delete on FireExtinguisher (201 & 200)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/test-pccc/fire-extinguishers')
        .set('Cookie', managerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({});

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);

      const deleteRes = await request(app.getHttpServer())
        .delete('/api/v1/test-pccc/fire-extinguishers/fe-1')
        .set('Cookie', managerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000');

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    it('should deny beiviewer create and delete on FireDrill (403)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/test-pccc/fire-drills')
        .set('Cookie', viewerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({});

      expect(createRes.status).toBe(403);
    });

    it('should allow beimanager create and delete on FireDrill (201 & 200)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/test-pccc/fire-drills')
        .set('Cookie', managerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000')
        .send({});

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
    });
  });

  describe('7. Logout & Session Invalidation', () => {
    it('should successfully log out and invalidate session', async () => {
      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', viewerCookie)
        .set('X-BEI-Request', '1')
        .set('Origin', 'http://localhost:3000');

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify cookie cleared
      const setCookies = logoutRes.headers['set-cookie'];
      expect(setCookies).toBeDefined();
      const cookieStr = Array.isArray(setCookies) ? setCookies[0] : setCookies;
      expect(cookieStr).toContain('Max-Age=0');

      // Subsequent /auth/me with revoked token must fail with 401
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', viewerCookie);

      expect(meRes.status).toBe(401);
    });
  });
});
