import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, TeachersModule, StudentsModule, AuthModule, WebhooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
