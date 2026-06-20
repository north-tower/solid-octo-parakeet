import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { MiningSessionHeartbeatDto } from './dto/mining-session-heartbeat.dto';
import { GamificationService } from './gamification.service';

@ApiTags('Phase 5 - Mining Integration')
@Controller('gamification/mining-sessions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MiningIntegrationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post(':sessionId/heartbeat')
  @ApiOperation({
    summary: 'Report mining session telemetry',
    description:
      'Records a power sample and updates session aggregates for desktop miner heartbeats.',
  })
  recordHeartbeat(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: MiningSessionHeartbeatDto,
  ) {
    return this.gamificationService.recordHeartbeat(user.sub, sessionId, dto);
  }

  @Post(':sessionId/abort')
  @ApiOperation({
    summary: 'Abort an active mining session',
    description:
      'Ends a mining session without rewarding coins or XP. Used for crashes or user cancellation.',
  })
  abortMiningSession(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.gamificationService.abortMiningSession(user.sub, sessionId);
  }
}
