import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { CharacterClass } from '../character.entity';

export class AllocateAttributesDto {
  @IsOptional() @IsInt() @Min(0) strength?: number;
  @IsOptional() @IsInt() @Min(0) agility?: number;
  @IsOptional() @IsInt() @Min(0) endurance?: number;
  @IsOptional() @IsInt() @Min(0) speed?: number;
  @IsOptional() @IsInt() @Min(0) recovery?: number;
}

export class GrantExpDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  source?: string;
}

export class UpdateWeightDto {
  @IsInt()
  @Min(15)
  weightKg: number;
}

export class UpdateNutritionDto {
  @IsInt()
  @Min(15)
  weightKg: number;

  @IsInt()
  @Min(5)
  @Max(120)
  ageYears: number;
}

export class UpdateTimezoneDto {
  /** IANA zone, e.g. "Asia/Tashkent", "Europe/Moscow" — determines the 5:00 AM quest reset. */
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  timezone: string;
}

export class CreateCharacterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name: string;

  @IsEnum(CharacterClass)
  class: CharacterClass;
}
