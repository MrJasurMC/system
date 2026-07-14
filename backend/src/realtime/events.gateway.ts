import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '@/redis/redis.service';
import { UsersService } from '@/users/users.service';

/**
 * One gateway, room-per-user (`user:<id>`), so emitting to a user from any
 * service is just `emitToUser(userId, event, payload)`. Backed by the Redis
 * adapter so events fan out across all API pods.
 *
 * The client identifies itself with the same session token it uses for
 * REST calls, passed via the socket handshake auth payload.
 */
@Injectable()
// NOTE: origin must never fall back to '*' — browsers reject a wildcard
// origin combined with credentials: true, so that combination would
// silently break every WebSocket connection. Default matches main.ts.
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redis: RedisService,
    private readonly users: UsersService,
  ) {}

  async afterInit() {
    try {
      await this.redis.whenReady();
      const client = this.redis.getClient();
      if (!client) throw new Error('Redis client unavailable');
      const pubClient = client.duplicate();
      const subClient = client.duplicate();
      this.server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('WebSocket gateway initialized with Redis adapter');
    } catch (err) {
      this.logger.error(
        `Could not attach Redis adapter, falling back to single-instance mode: ${(err as Error).message}`,
      );
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const user = await this.users.findBySessionToken(token);
      if (!user) throw new Error('Invalid or expired session');
      client.data.userId = user.id;
      client.join(`user:${user.id}`);
      this.server.emit('user:online', { userId: user.id });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) this.server.emit('user:offline', { userId });
  }

  private extractToken(client: Socket): string {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;
    const header = client.handshake.headers['authorization'];
    if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
    throw new Error('No session token provided');
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  broadcast(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }
}
