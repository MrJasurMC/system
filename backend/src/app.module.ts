import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { entities } from '@/config/typeorm.cli';
import { HealthController } from '@/common/health.controller';
import { AuthGuard } from '@/common/guards/auth.guard';

import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { CharactersModule } from '@/characters/characters.module';
import { QuestsModule } from '@/quests/quests.module';
import { WorkoutsModule } from '@/workouts/workouts.module';
import { InventoryModule } from '@/inventory/inventory.module';
import { AchievementsModule } from '@/achievements/achievements.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { RedisModule } from '@/redis/redis.module';

import { ScheduleModule } from '@nestjs/schedule';
import { BossesModule } from '@/bosses/bosses.module';
import { ChroniclesModule } from '@/chronicles/chronicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Primary DB
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const password = config.get<string>('DB_PASSWORD');
        const username = config.get<string>('DB_USER');
        if (typeof password !== 'string' || password.length === 0) {
          throw new Error(
            'DB_PASSWORD is not set. Copy backend/.env.example to backend/.env and fill in real values before starting the app.',
          );
        }
        if (typeof username !== 'string' || username.length === 0) {
          throw new Error(
            'DB_USER is not set. Copy backend/.env.example to backend/.env and fill in real values before starting the app.',
          );
        }
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: Number(config.get('DB_PORT') ?? 5432),
          username,
          password,
          database: config.get<string>('DB_NAME') ?? 'project_limitless',
          ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
          entities,
          synchronize: config.get('NODE_ENV') !== 'production',
          autoLoadEntities: true,
        };
      },
    }),

    // Rate limiting / throttling
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.get('THROTTLE_TTL') ?? 60) * 1000,
            limit: Number(config.get('THROTTLE_LIMIT') ?? 100),
          },
        ],
      }),
    }),

    RedisModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    CharactersModule,
    QuestsModule,
    WorkoutsModule,
    InventoryModule,
    AchievementsModule,
    NotificationsModule,
    BossesModule,
    ChroniclesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Every route requires a valid session token by default; opt out per-route with @Public().
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
