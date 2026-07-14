import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workout.entity';
import { WorkoutSession } from './workout-session.entity';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { RealtimeModule } from '@/realtime/realtime.module';
import { CharactersModule } from '@/characters/characters.module';

@Module({
  imports: [TypeOrmModule.forFeature([Workout, WorkoutSession]), RealtimeModule, CharactersModule],
  providers: [WorkoutsService],
  controllers: [WorkoutsController],
})
export class WorkoutsModule {}
