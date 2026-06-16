import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CompleteMiningSessionDto } from './dto/complete-mining-session.dto';
import { StartMiningSessionDto } from './dto/start-mining-session.dto';
import { UpdateMiningPowerDto } from './dto/update-mining-power.dto';
import { GamificationService } from './gamification.service';

@ApiTags('Phase 2 - Gamification')
@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get my gamification dashboard',
    description: 'Returns balances, level, and active mining-session state.',
  })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getDashboard(user.sub);
  }

  @Patch('me/mining-power')
  @ApiOperation({
    summary: 'Update mining power',
    description:
      'Sets the user mining power percentage used for session calculations.',
  })
  updateMiningPower(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMiningPowerDto,
  ) {
    return this.gamificationService.updateMiningPower(user.sub, dto);
  }

  @Post('mining-sessions/start')
  @ApiOperation({
    summary: 'Start a mining session',
    description:
      'Opens a new mining session for the authenticated user, optionally overriding mining power.',
  })
  startMiningSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartMiningSessionDto,
  ) {
    return this.gamificationService.startMiningSession(user.sub, dto);
  }

  @Post('mining-sessions/:sessionId/complete')
  @ApiOperation({
    summary: 'Complete a mining session',
    description:
      'Closes a mining session, applies coin rewards, XP, and referral commissions where applicable.',
  })
  completeMiningSession(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteMiningSessionDto,
  ) {
    return this.gamificationService.completeMiningSession(
      user.sub,
      sessionId,
      dto,
    );
  }
}
