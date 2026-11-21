import { Global, Module } from '@nestjs/common';
import { GoogleMeetService } from './google-meet.service';

@Global()
@Module({
  providers: [GoogleMeetService],
  exports: [GoogleMeetService],
})
export class GoogleModule {}
