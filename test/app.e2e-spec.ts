import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { generate } from 'otplib';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TotpService } from './../src/admin/totp.service';

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
      update: {
        passwordHash,
        totpEnabled: false,
        totpSecret: null,
      },
      create: {
        email: 'e2e-admin@example.com',
        passwordHash,
        name: 'E2E管理者',
        totpEnabled: false,
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
    expect(loginResponse.body.mfaRequired).toBe(false);

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

describe('Admin MFA (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    process.env.ADMIN_EMAIL = 'e2e-mfa@example.com';
    process.env.ADMIN_PASSWORD = 'e2e-password123';
    process.env.JWT_SECRET = 'e2e-jwt-secret';
    process.env.MFA_ENCRYPTION_KEY = 'e2e-mfa-encryption-key';

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
      where: { email: 'e2e-mfa@example.com' },
      update: {
        passwordHash,
        totpEnabled: false,
        totpSecret: null,
      },
      create: {
        email: 'e2e-mfa@example.com',
        passwordHash,
        name: 'E2E MFA管理者',
        totpEnabled: false,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('TOTP 有効化後は2段階ログインが必要', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({
        email: 'e2e-mfa@example.com',
        password: 'e2e-password123',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;
    expect(accessToken).toBeDefined();

    const setupResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/mfa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(setupResponse.body.otpAuthUrl).toContain('otpauth://');
    expect(setupResponse.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);

    const admin = await prisma.adminUser.findUnique({
      where: { email: 'e2e-mfa@example.com' },
    });
    expect(admin?.totpSecret).toBeTruthy();

    const totpService = new TotpService();
    const secret = totpService.decryptSecret(admin!.totpSecret!);
    const code = await generate({ secret });

    await request(app.getHttpServer())
      .post('/api/v1/admin/mfa/enable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code })
      .expect(200)
      .expect((res) => {
        expect(res.body.totpEnabled).toBe(true);
      });

    const mfaLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({
        email: 'e2e-mfa@example.com',
        password: 'e2e-password123',
      })
      .expect(200);

    expect(mfaLoginResponse.body.mfaRequired).toBe(true);
    expect(mfaLoginResponse.body.mfaToken).toBeDefined();
    expect(mfaLoginResponse.body.accessToken).toBeUndefined();

    const verifyCode = await generate({ secret });
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/mfa/verify')
      .send({
        mfaToken: mfaLoginResponse.body.mfaToken,
        code: verifyCode,
      })
      .expect(200);

    const finalToken = verifyResponse.body.accessToken as string;
    expect(verifyResponse.body.mfaRequired).toBe(false);
    expect(finalToken).toBeDefined();

    await request(app.getHttpServer())
      .get('/api/v1/admin/me')
      .set('Authorization', `Bearer ${finalToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.totpEnabled).toBe(true);
      });
  });
});

describe('Admin users (e2e)', () => {
  const createdEmail = 'e2e-created-admin@example.com';
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
      update: {
        passwordHash,
        totpEnabled: false,
        totpSecret: null,
      },
      create: {
        email: 'e2e-admin@example.com',
        passwordHash,
        name: 'E2E管理者',
        totpEnabled: false,
      },
    });
    await prisma.adminUser.deleteMany({ where: { email: createdEmail } });
  });

  afterEach(async () => {
    await prisma.adminUser.deleteMany({ where: { email: createdEmail } });
    await app.close();
  });

  async function loginAsSeedAdmin(): Promise<string> {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({
        email: 'e2e-admin@example.com',
        password: 'e2e-password123',
      })
      .expect(200);
    return loginResponse.body.accessToken as string;
  }

  it('未認証では管理者一覧・追加できない', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/users').expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .send({
        email: createdEmail,
        password: 'new-password123',
        name: '追加管理者',
      })
      .expect(401);
  });

  it('ログイン中の管理者はユーザーを追加でき、追加したユーザーでログインできる', async () => {
    const token = await loginAsSeedAdmin();

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: createdEmail,
        password: 'new-password123',
        name: '追加管理者',
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      email: createdEmail,
      name: '追加管理者',
      totpEnabled: false,
    });
    expect(createResponse.body.id).toBeDefined();
    expect(createResponse.body.passwordHash).toBeUndefined();
    expect(createResponse.body.totpSecret).toBeUndefined();

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(
      listResponse.body.some((user: { email: string }) => user.email === createdEmail),
    ).toBe(true);

    const newLogin = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({
        email: createdEmail,
        password: 'new-password123',
      })
      .expect(200);

    expect(newLogin.body.mfaRequired).toBe(false);
    expect(newLogin.body.accessToken).toBeDefined();
  });

  it('同じメールアドレスの追加は 409 を返す', async () => {
    const token = await loginAsSeedAdmin();

    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: createdEmail,
        password: 'new-password123',
        name: '追加管理者',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: createdEmail,
        password: 'another-password123',
        name: '重複管理者',
      })
      .expect(409);
  });

  it('パスワードが短い場合は 400 を返す', async () => {
    const token = await loginAsSeedAdmin();

    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: createdEmail,
        password: 'short',
        name: '追加管理者',
      })
      .expect(400);
  });
});
