import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { UsersService } from '@/users/users.service';

/**
 * Every request must carry `Authorization: Bearer <token>`. The token must
 * be a real, server-issued session token from POST /auth/login or
 * /auth/register (valid for AuthService.SESSION_TTL_DAYS). Routes marked
 * with @Public() (login/register/health) skip this check.
 *
 * IMPORTANT: this guard must never accept a raw user id as a substitute
 * for a session token — user ids are not secret (they appear in
 * leaderboards, WebSocket events, API payloads) and treating one as a
 * valid credential would let anyone log in as anyone else.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Missing session token.');
    }

    const user = await this.users.findBySessionToken(token);
    if (!user) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    request.user = user;
    return true;
  }
}
