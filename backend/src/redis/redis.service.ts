import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Thin wrapper around ioredis. §10 flow diagram calls for Redis as the
 * shared cache / pub-sub backbone; this is the one client the rest of the
 * app is meant to depend on (see README "Redis — not wired up yet").
 *
 * Two things use it so far:
 *  - RealtimeModule attaches the Socket.IO Redis adapter using duplicated
 *    pub/sub connections off of this same config (see events.gateway.ts).
 *  - Services can store short-lived
 *    tokens here (natural fit for TTL'd, one-time-use data — no new tables
 *    or migrations required).
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private readyPromise: Promise<void>;
  private resolveReady: () => void;

  constructor(private readonly config: ConfigService) {
    // Created here, not in onModuleInit, so it exists the instant this
    // service is constructed — callers can safely await whenReady() no
    // matter which module initializes first.
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

onModuleInit(): void {
    const password = this.config.get<string>('REDIS_PASSWORD');
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST') ?? 'localhost',
      port: Number(this.config.get('REDIS_PORT') ?? 6379),
      password: password && password.length > 0 ? password : undefined,
      tls: this.config.get('REDIS_TLS') === 'true' ? {} : undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (attempt: number) => Math.min(attempt * 200, 5000),
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
    this.client.once('ready', () => {
      this.logger.log('Connected to Redis');
      this.resolveReady();
    });
    // Don't block callers of whenReady() forever if Redis never comes up.
    this.client.once('error', () => this.resolveReady());
  }

  /** Resolves once the client has a live connection (or has failed to get one). Anything that needs the client before using it — e.g. the Socket.IO Redis adapter, which can't tolerate an undefined client — should await this first. */
  async whenReady(): Promise<void> {
    await this.readyPromise;
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  /** Raw client, mainly for the Socket.IO adapter which needs its own duplicated connections. */
  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Atomically increments a counter and (only on its first increment) sets
   * an expiry, so it can be used as a fixed-window rate limiter: e.g.
   * `incr('rl:forgot-password:user@example.com', 3600)` returns how many
   * requests have been made in the current hour.
   */
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }
}
