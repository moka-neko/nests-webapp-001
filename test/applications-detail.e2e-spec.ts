import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Applications detail (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/teachers/applications/:id', () => {
    it('作成した先生応募の詳細を取得できる', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/teachers/applications')
        .send({
          email: `teacher-detail-${Date.now()}@example.com`,
          nameKanji: '山田 太郎',
          nameKatakana: 'ヤマダ タロウ',
          age: 25,
          workLocation: '東京都渋谷区',
          resumeUrl: 'https://drive.google.com/file/d/xxxxx',
        })
        .expect(201);

      const { id, email, nameKanji } = createResponse.body as {
        id: string;
        email: string;
        nameKanji: string;
      };

      const detailResponse = await request(app.getHttpServer())
        .get(`/api/v1/teachers/applications/${id}`)
        .expect(200);

      expect(detailResponse.body).toMatchObject({
        id,
        email,
        nameKanji,
        status: 'PENDING',
      });
    });

    it('存在しない ID の場合 404 を返す', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/v1/teachers/applications/00000000-0000-4000-8000-000000000000',
        )
        .expect(404);
    });
  });

  describe('GET /api/v1/students/applications/:id', () => {
    it('作成した生徒応募の詳細を取得できる', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/students/applications')
        .send({
          email: `student-detail-${Date.now()}@example.com`,
          name: '鈴木 花子',
          phoneNumber: '090-9876-5432',
          nationality: '日本',
        })
        .expect(201);

      const { id, email, name } = createResponse.body as {
        id: string;
        email: string;
        name: string;
      };

      const detailResponse = await request(app.getHttpServer())
        .get(`/api/v1/students/applications/${id}`)
        .expect(200);

      expect(detailResponse.body).toMatchObject({
        id,
        email,
        name,
      });
    });

    it('存在しない ID の場合 404 を返す', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/v1/students/applications/00000000-0000-4000-8000-000000000000',
        )
        .expect(404);
    });
  });
});
