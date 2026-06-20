import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { RewardsService } from './rewards.service';

@ApiTags('Phase 4 - Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('games')
  @ApiOperation({
    summary: 'List reward games',
    description: 'Returns active games in the reward catalog with item counts.',
  })
  listGames() {
    return this.rewardsService.listGames();
  }

  @Get('games/:gameSlug')
  @ApiOperation({
    summary: 'List rewards for a game',
    description: 'Returns active catalog items for the given game slug.',
  })
  listCatalogByGame(@Param('gameSlug') gameSlug: string) {
    return this.rewardsService.listCatalogByGame(gameSlug);
  }

  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a reward redemption request',
    description:
      'Creates a pending redemption request after validating the user balance. Coins are deducted when the request is fulfilled.',
  })
  createRewardRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRewardRequestDto,
  ) {
    return this.rewardsService.createRewardRequest(user.sub, dto);
  }

  @Get('requests/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List my reward requests',
    description: 'Returns the authenticated user redemption request history.',
  })
  listMyRewardRequests(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.listMyRewardRequests(user.sub);
  }
}
