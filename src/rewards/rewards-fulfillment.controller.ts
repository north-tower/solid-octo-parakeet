import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RewardRequestStatus } from '@prisma/client';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FulfillmentApiKeyGuard } from '../common/guards/fulfillment-api-key.guard';
import { FulfillRewardRequestDto } from './dto/fulfill-reward-request.dto';
import { ListFulfillmentRequestsDto } from './dto/list-fulfillment-requests.dto';
import { RejectRewardRequestDto } from './dto/reject-reward-request.dto';
import { RewardsService } from './rewards.service';

@ApiTags('Phase 4 - Rewards Fulfillment')
@Controller('rewards/fulfillment')
@UseGuards(FulfillmentApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'Fulfillment API key configured via FULFILLMENT_API_KEY.',
  required: true,
})
export class RewardsFulfillmentController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('requests')
  @ApiOperation({
    summary: 'List reward requests for manual fulfillment',
    description:
      'Returns redemption requests filtered by status. Defaults to pending requests.',
  })
  listFulfillmentRequests(@Query() query: ListFulfillmentRequestsDto) {
    return this.rewardsService.listFulfillmentRequests(
      query.status ?? RewardRequestStatus.PENDING,
    );
  }

  @Patch('requests/:requestId/fulfill')
  @ApiOperation({
    summary: 'Fulfill a reward request',
    description:
      'Marks a pending request as fulfilled and deducts coins from the user.',
  })
  fulfillRewardRequest(
    @Param('requestId') requestId: string,
    @Body() dto: FulfillRewardRequestDto,
  ) {
    return this.rewardsService.fulfillRewardRequest(requestId, dto);
  }

  @Patch('requests/:requestId/reject')
  @ApiOperation({
    summary: 'Reject a reward request',
    description: 'Marks a pending request as rejected without deducting coins.',
  })
  rejectRewardRequest(
    @Param('requestId') requestId: string,
    @Body() dto: RejectRewardRequestDto,
  ) {
    return this.rewardsService.rejectRewardRequest(requestId, dto);
  }
}
