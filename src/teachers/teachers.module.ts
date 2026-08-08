import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';

@Module({
  imports: [StorageModule],
  controllers: [TeachersController],
  providers: [TeachersService],
})
export class TeachersModule {}
