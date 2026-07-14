import { IsInt, Min } from 'class-validator';

export class UpdateQuestProgressDto {
  @IsInt()
  @Min(0)
  progress: number;
}
