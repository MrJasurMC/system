import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

/** How long a session stays valid without the player having to log in again. */
export const SESSION_TTL_DAYS = 30;

export interface AuthResult {
  user: Pick<User, 'id' | 'username' | 'email' | 'displayName'>;
  token: string;
  expiresAt: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  private async issueSession(user: User): Promise<AuthResult> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.users.setSession(user.id, token, expiresAt);
    return {
      user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName },
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.users.findByEmail(dto.email),
      this.users.findByUsername(dto.username),
    ]);
    if (existingEmail) throw new ConflictException('An account with this email already exists.');
    if (existingUsername) throw new ConflictException('That username is taken.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({ username: dto.username, email: dto.email, passwordHash });
    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password.');

    return this.issueSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setSession(userId, null, null);
  }
}
