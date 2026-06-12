import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    process.env.ADMIN_EMAIL = 'e2e-admin@example.com';
    process.env.ADMIN_PASSWORD = 'e2e-password123';
    process.env.JWT_SECRET = 'e2e-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    const passwordHash = await bcrypt.hash('e2e-password123', 10);
    await prisma.adminUser.upsert({
      where: { email: 'e2e-admin@example.com' },
      update: { passwordHash },
      create: {
        email: 'e2e-admin@example.com',
        passwordHash,
        name: 'E2E管理者',
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) は認証なしでアクセスできる', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('管理 API は認証なしで 401 を返す', () => {
    return request(app.getHttpServer())
      .get('/api/v1/teachers/applications')
      .expect(401);
  });

  it('管理者ログイン後に管理 API にアクセスできる', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({
        email: 'e2e-admin@example.com',
        password: 'e2e-password123',
      })
      .expect(200);

    const token = loginResponse.body.accessToken as string;
    expect(token).toBeDefined();

    await request(app.getHttpServer())
      .get('/api/v1/teachers/applications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe('e2e-admin@example.com');
      });
  });
});
