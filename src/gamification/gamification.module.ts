import { Module } from '@nestjs/common';
import { LevelService } from '../common/services/level.service';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, LevelService],
  exports: [GamificationService],
})
export class GamificationModule {}
