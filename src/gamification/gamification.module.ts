import { Module } from '@nestjs/common';
import { LevelService } from '../common/services/level.service';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { MiningIntegrationController } from './mining-integration.controller';

@Module({
  controllers: [GamificationController, MiningIntegrationController],
  providers: [GamificationService, LevelService],
  exports: [GamificationService],
})
export class GamificationModule {}
