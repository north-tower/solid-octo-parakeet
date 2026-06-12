import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LevelService } from '../common/services/level.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levelService: LevelService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { referrals: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const referralEarnings = await this.prisma.referralEarning.aggregate({
      where: { referrerUserId: userId },
      _sum: { amountEarned: true },
    });

    const referralPercent = await this.levelService.getReferralPercent(
      user.level,
    );
    const xpToNextLevel = await this.levelService.getXpToNextLevel(
      user.level,
      user.xp,
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      referralCode: user.referralCode,
      xp: user.xp,
      level: user.level,
      coinBalance: user.coinBalance.toString(),
      miningPowerPercent: user.miningPowerPercent,
      referralPercent,
      xpToNextLevel,
      referralsCount: user._count.referrals,
      totalReferralEarnings:
        referralEarnings._sum.amountEarned?.toString() ?? '0',
      createdAt: user.createdAt,
    };
  }
}
