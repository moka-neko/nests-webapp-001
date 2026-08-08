import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * 先生応募の履歴書フォーム入力 + 顔写真アップロード（Supabase Storage）の e2e テスト。
 * Supabase Storage はローカル HTTP スタブで代替する。
 */
describe('Teacher resume & photo upload (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let supabaseStub: Server;
  let uploadedPaths: string[];
  const createdIds: string[] = [];

  beforeAll(async () => {
    // Supabase Storage の REST API を模したスタブサーバー
    uploadedPaths = [];
    supabaseStub = createServer((req, res) => {
      if (req.method === 'POST' && req.url?.startsWith('/storage/v1/object/')) {
        uploadedPaths.push(req.url);
        req.resume();
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ Key: req.url }));
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((resolve) =>
      supabaseStub.listen(0, '127.0.0.1', resolve),
    );
    const port = (supabaseStub.address() as AddressInfo).port;
    process.env.SUPABASE_URL = `http://127.0.0.1:${port}`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'e2e-service-role-key';
    process.env.SUPABASE_STORAGE_BUCKET = 'teacher-photos';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await prisma.teacherApplication
        .delete({ where: { id } })
        .catch(() => undefined);
    }
    await app.close();
    await new Promise<void>((resolve, reject) =>
      supabaseStub.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it('顔写真をアップロードすると Supabase の公開URLが返る', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/teachers/applications/photo')
      .attach('photo', Buffer.from('fake-jpeg-content'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    const { photoUrl } = response.body as { photoUrl: string };
    expect(photoUrl).toMatch(
      /\/storage\/v1\/object\/public\/teacher-photos\/photos\/[0-9a-f-]+\.jpg$/,
    );
    expect(uploadedPaths).toHaveLength(1);
    expect(uploadedPaths[0]).toMatch(
      /^\/storage\/v1\/object\/teacher-photos\/photos\/[0-9a-f-]+\.jpg$/,
    );
  });

  it('画像以外のファイルは 400 を返す', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/teachers/applications/photo')
      .attach('photo', Buffer.from('%PDF-1.4'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
  });

  it('履歴書フォーム入力+顔写真URL付きで応募でき、取得時に履歴書が返る', async () => {
    const photoResponse = await request(app.getHttpServer())
      .post('/api/v1/teachers/applications/photo')
      .attach('photo', Buffer.from('fake-png-content'), {
        filename: 'photo.png',
        contentType: 'image/png',
      })
      .expect(201);
    const { photoUrl } = photoResponse.body as { photoUrl: string };

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/teachers/applications')
      .send({
        email: 'e2e-resume@example.com',
        nameKanji: 'テスト 太郎',
        nameKatakana: 'テスト タロウ',
        age: 28,
        workLocation: '東京都渋谷区',
        resume: {
          photoUrl,
          birthDate: '1998-04-01',
          gender: '男性',
          phoneNumber: '090-1234-5678',
          postalCode: '150-0002',
          address: '東京都渋谷区渋谷1-2-3',
          nearestStation: 'JR山手線 渋谷駅',
          education: [
            { yearMonth: '2017-04', description: '○○大学 教育学部 入学' },
            { yearMonth: '2021-03', description: '○○大学 教育学部 卒業' },
          ],
          workHistory: [
            { yearMonth: '2021-04', description: '株式会社○○ 入社' },
          ],
          qualifications: [
            {
              yearMonth: '2021-03',
              description: '中学校教諭一種免許状（数学） 取得',
            },
          ],
          motivation: '子どもに教えることが好きだからです。',
          selfPromotion: '塾講師経験3年。',
          hobbies: '読書',
          requests: '週3日勤務を希望します。',
        },
      })
      .expect(201);

    const created = createResponse.body as {
      id: string;
      resumeUrl: string | null;
      resume: Record<string, unknown> | null;
    };
    const id = created.id;
    createdIds.push(id);
    expect(created.resumeUrl).toBeNull();
    expect(created.resume).toMatchObject({
      photoUrl,
      birthDate: '1998-04-01',
      education: [
        { yearMonth: '2017-04', description: '○○大学 教育学部 入学' },
        { yearMonth: '2021-03', description: '○○大学 教育学部 卒業' },
      ],
      motivation: '子どもに教えることが好きだからです。',
    });

    // 管理 API（認証なしだと 401）で取得できることは既存テストで担保済みのため、
    // ここでは DB 反映を直接確認する
    const stored = await prisma.teacherApplication.findUnique({
      where: { id },
      include: { resume: true },
    });
    expect(stored?.resume?.photoUrl).toBe(photoUrl);
    expect(stored?.resume?.qualifications).toEqual([
      {
        yearMonth: '2021-03',
        description: '中学校教諭一種免許状（数学） 取得',
      },
    ]);
  });

  it('履歴書なし（従来の resumeUrl のみ）でも応募できる', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/teachers/applications')
      .send({
        email: 'e2e-legacy@example.com',
        nameKanji: 'レガシー 花子',
        nameKatakana: 'レガシー ハナコ',
        age: 30,
        workLocation: '大阪府大阪市',
        resumeUrl: 'https://drive.google.com/file/d/legacy',
      })
      .expect(201);

    const created = response.body as {
      id: string;
      resumeUrl: string | null;
      resume: Record<string, unknown> | null;
    };
    createdIds.push(created.id);
    expect(created.resumeUrl).toBe('https://drive.google.com/file/d/legacy');
    expect(created.resume).toBeNull();
  });

  it('履歴書の年月形式が不正な場合は 400 を返す', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/teachers/applications')
      .send({
        email: 'e2e-invalid@example.com',
        nameKanji: '不正 太郎',
        nameKatakana: 'フセイ タロウ',
        age: 25,
        workLocation: '東京都',
        resume: {
          education: [{ yearMonth: '2020/04', description: '○○大学 入学' }],
        },
      })
      .expect(400);
  });
});
