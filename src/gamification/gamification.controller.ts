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
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { CompleteMiningSessionDto } from './dto/complete-mining-session.dto';
import { StartMiningSessionDto } from './dto/start-mining-session.dto';
import { UpdateMiningPowerDto } from './dto/update-mining-power.dto';
import { GamificationService } from './gamification.service';

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getDashboard(user.sub);
  }

  @Patch('me/mining-power')
  updateMiningPower(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMiningPowerDto,
  ) {
    return this.gamificationService.updateMiningPower(user.sub, dto);
  }

  @Post('mining-sessions/start')
  startMiningSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartMiningSessionDto,
  ) {
    return this.gamificationService.startMiningSession(user.sub, dto);
  }

  @Post('mining-sessions/:sessionId/complete')
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
