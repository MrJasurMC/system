import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis wiring. Global so RealtimeModule, etc. can all
 * inject RedisService without each declaring their own connection.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
