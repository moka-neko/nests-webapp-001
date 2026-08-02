import { Module } from '@nestjs/common';
import { DevSeedService } from './dev-seed.service';

@Module({
  providers: [DevSeedService],
})
export class DevSeedModule {}
