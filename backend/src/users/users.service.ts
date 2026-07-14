import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Player not found.');
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.users.findOne({ where: { username } });
  }

  /** Looks up the player currently holding a still-valid session token. */
  async findBySessionToken(token: string): Promise<User | null> {
    const user = await this.users.findOne({ where: { sessionToken: token } });
    if (!user || !user.sessionExpiresAt || user.sessionExpiresAt.getTime() < Date.now()) {
      return null;
    }
    return user;
  }

  create(data: { username: string; email: string; passwordHash: string }): Promise<User> {
    const user = this.users.create({
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      displayName: data.username,
    });
    return this.users.save(user);
  }

  async setSession(id: string, token: string | null, expiresAt: Date | null): Promise<void> {
    await this.users.update({ id }, { sessionToken: token, sessionExpiresAt: expiresAt });
  }

  async updateProfile(
    id: string,
    patch: Partial<Pick<User, 'displayName' | 'avatarUrl'>>,
  ): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, patch);
    return this.users.save(user);
  }

  /** Deletes a player and everything cascaded from it (via onDelete: 'CASCADE' relations). */
  async deletePlayer(id: string): Promise<void> {
    await this.users.delete({ id });
  }

  /**
   * "New Game" reset — wipes every bit of progress (character, attributes,
   * skills, quest progress, inventory, achievements, notifications, boss
   * participation, workout sessions, chronicle log) while leaving the User
   * row itself untouched, so username/email/password and the session stay
   * valid. Everything runs in one transaction so a mid-way failure can't
   * leave the account half-reset.
   *
   * Character/attributes/skills are deleted via a raw DELETE ... USING join
   * rather than a repository cascade, since a targeted single-row delete
   * doesn't trigger onDelete: 'CASCADE' the way deleting the parent User
   * row does — those cascades only fire off of a User delete.
   */
  async resetProgress(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM skills USING characters
         WHERE skills."characterId" = characters.id AND characters."userId" = $1`,
        [userId],
      );
      await manager.query(
        `DELETE FROM attributes USING characters
         WHERE attributes."characterId" = characters.id AND characters."userId" = $1`,
        [userId],
      );
      await manager.query(`DELETE FROM characters WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM quest_progress WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM inventory_items WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM user_achievements WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM notifications WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM boss_damage WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM workout_sessions WHERE "userId" = $1`, [userId]);
      await manager.query(`DELETE FROM chronicles WHERE "userId" = $1`, [userId]);
    });
  }
}
