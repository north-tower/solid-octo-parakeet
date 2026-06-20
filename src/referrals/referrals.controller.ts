import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { ReferralsService } from './referrals.service';

@ApiTags('Phase 3 - Referrals')
@Controller('referrals')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get my referral dashboard',
    description:
      'Returns referral code, earnings summary, referred users, and level-based referral rate.',
  })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.referralsService.getDashboard(user.sub);
  }
}
