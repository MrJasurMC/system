import { Body, Controller, Delete, HttpCode, Patch, Post } from '@nestjs/common';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from './user.entity';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: User) {
    return this.users.updateProfile(user.id, dto);
  }

  /** Deletes this device's character and all progress. Irreversible. */
  @Delete('me')
  deleteMe(@CurrentUser() user: User) {
    return this.users.deletePlayer(user.id);
  }

  /**
   * Wipes character/level/gold/quests/inventory/achievements/etc back to a
   * fresh start, but keeps the account itself (username, email, password,
   * session) intact — "New Game", not "Delete Account".
   */
  @Post('me/reset')
  @HttpCode(204)
  async resetProgress(@CurrentUser() user: User) {
    await this.users.resetProgress(user.id);
  }
}
