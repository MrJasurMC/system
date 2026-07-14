import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BossesService } from './bosses/bosses.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const bossesService = app.get(BossesService);
  await bossesService.spawnWeeklyBoss();
  // eslint-disable-next-line no-console -- intentional CLI output for this manual-run script
  console.log('Successfully spawned a new weekly boss.');
  await app.close();
}
bootstrap();
