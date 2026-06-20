import { Module } from '@nestjs/common';
import { LevelService } from '../common/services/level.service';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  controllers: [ReferralsController],
  providers: [ReferralsService, LevelService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
