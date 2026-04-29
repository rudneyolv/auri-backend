import { Module } from '@nestjs/common';
import { EventsService } from './event.service';
import { EventsGateway } from './event.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
  imports: [AuthModule],
})
export class EventsModule {}
