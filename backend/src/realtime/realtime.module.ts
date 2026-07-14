import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [RedisModule, UsersModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class RealtimeModule {}
