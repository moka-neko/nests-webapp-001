import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('塾 応募管理 API')
    .setDescription(
      '先生・生徒の新規応募受付、選考ステータス管理、LINE連携、面接予約通知を行う REST API です。',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'POST /api/v1/admin/login で取得したトークン',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description:
          '応募受付 API 用キー（APPLICATION_API_KEY 設定時のみ必須）',
      },
      'ApiKey',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-webhook-secret',
        in: 'header',
        description:
          'TimeRex Webhook 用シークレット（TIMEREX_WEBHOOK_SECRET 設定時のみ必須）',
      },
      'WebhookSecret',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
