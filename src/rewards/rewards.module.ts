import { Module } from '@nestjs/common';
import { FulfillmentApiKeyGuard } from '../common/guards/fulfillment-api-key.guard';
import { RewardsFulfillmentController } from './rewards-fulfillment.controller';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
  controllers: [RewardsController, RewardsFulfillmentController],
  providers: [RewardsService, FulfillmentApiKeyGuard],
  exports: [RewardsService],
})
export class RewardsModule {}
