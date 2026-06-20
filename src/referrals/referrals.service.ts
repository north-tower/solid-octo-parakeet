import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  LevelConfigSnapshot,
  LevelService,
} from '../common/services/level.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levelService: LevelService,
  ) {}

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { referrals: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [configs, earningsSummary, referredUsers, recentEarnings] =
      await Promise.all([
        this.levelService.getAllLevelConfigs(),
        this.prisma.referralEarning.aggregate({
          where: { referrerUserId: userId },
          _sum: { amountEarned: true },
          _count: true,
        }),
        this.prisma.user.findMany({
          where: { referredByUserId: userId },
          select: {
            id: true,
            displayName: true,
            email: true,
            createdAt: true,
            referralEarningsAsReferred: {
              where: { referrerUserId: userId },
              select: { amountEarned: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.referralEarning.findMany({
          where: { referrerUserId: userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            referred: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        }),
      ]);

    const currentLevelConfig = this.getCurrentLevelConfig(configs, user.level);
    const nextLevelConfig = configs.find(
      (config) => config.level === user.level + 1,
    );
    const referralPercent = currentLevelConfig?.referralPercent ?? 10;

    return {
      profile: {
        referralCode: user.referralCode,
        referralsCount: user._count.referrals,
      },
      progression: {
        level: user.level,
        xp: user.xp,
        referralPercent,
        currentLevelXpFloor: currentLevelConfig?.xpRequired ?? 0,
        nextLevelXpTarget: nextLevelConfig?.xpRequired ?? null,
        xpToNextLevel: nextLevelConfig
          ? Math.max(0, nextLevelConfig.xpRequired - user.xp)
          : null,
        nextLevelReferralPercent: nextLevelConfig?.referralPercent ?? null,
      },
      earnings: {
        totalEarned: earningsSummary._sum.amountEarned?.toString() ?? '0',
        totalSessions: earningsSummary._count,
      },
      referredUsers: referredUsers.map((referredUser) => {
        const totalEarnedFromUser = referredUser.referralEarningsAsReferred.reduce(
          (sum, earning) => sum.add(earning.amountEarned),
          new Prisma.Decimal(0),
        );

        return {
          id: referredUser.id,
          displayName: referredUser.displayName,
          email: referredUser.email,
          joinedAt: referredUser.createdAt,
          totalEarnedFromUser: totalEarnedFromUser.toString(),
          sessionsCount: referredUser.referralEarningsAsReferred.length,
        };
      }),
      recentEarnings: recentEarnings.map((earning) => ({
        id: earning.id,
        amountEarned: earning.amountEarned.toString(),
        commissionBase: earning.commissionBase.toString(),
        referrerRate: earning.referrerRate.toString(),
        referredUser: {
          id: earning.referred.id,
          displayName: earning.referred.displayName,
          email: earning.referred.email,
        },
        miningSessionId: earning.miningSessionId,
        createdAt: earning.createdAt,
      })),
    };
  }

  private getCurrentLevelConfig(
    configs: LevelConfigSnapshot[],
    currentLevel: number,
  ) {
    return (
      configs.find((config) => config.level === currentLevel) ??
      configs
        .filter((config) => config.level <= currentLevel)
        .at(-1)
    );
  }
}
