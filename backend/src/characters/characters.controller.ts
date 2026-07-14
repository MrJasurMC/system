import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { AllocateAttributesDto, CreateCharacterDto, UpdateNutritionDto, UpdateTimezoneDto, UpdateWeightDto } from './dto/character.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

@Controller('characters')
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  /** POST /api/characters — creates the caller's character. One per account. */
  @Post()
  create(@Body() dto: CreateCharacterDto, @CurrentUser() user: User) {
    return this.characters.createForUser(user.id, dto);
  }

  /** GET /api/characters — returns the caller's own character (single-character model). */
  @Get()
  getMine(@CurrentUser() user: User) {
    return this.characters.getByUserId(user.id);
  }

  /** GET /api/characters/:id — kept for parity with §6's spec; scoped to self for now. */
  @Get(':id')
  getOne(@Param('id') _id: string, @CurrentUser() user: User) {
    return this.characters.getByUserId(user.id);
  }

  /** PUT/PATCH /api/characters/:id — allocate unspent attribute points. */
  @Patch(':id/attributes')
  allocate(@Body() dto: AllocateAttributesDto, @CurrentUser() user: User) {
    return this.characters.allocateAttributes(user.id, dto);
  }

  /** PATCH /api/characters/:id/timezone — sets the region used for the 5:00 AM daily quest reset. */
  @Patch(':id/timezone')
  setTimezone(@Body() dto: UpdateTimezoneDto, @CurrentUser() user: User) {
    return this.characters.setTimezone(user.id, dto.timezone);
  }

  /** PATCH /api/characters/:id/weight — sets bodyweight, drives Side quest water/calorie targets. */
  @Patch(':id/weight')
  setWeight(@Body() dto: UpdateWeightDto, @CurrentUser() user: User) {
    return this.characters.setWeight(user.id, dto.weightKg);
  }

  /** PATCH /api/characters/:id/nutrition — sets bodyweight + age, drives Side quest water/calorie targets. */
  @Patch(':id/nutrition')
  setNutrition(@Body() dto: UpdateNutritionDto, @CurrentUser() user: User) {
    return this.characters.setNutrition(user.id, dto.weightKg, dto.ageYears);
  }
}
