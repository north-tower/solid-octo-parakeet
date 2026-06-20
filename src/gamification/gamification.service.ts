import {
  CoinTransactionType,
  MiningSessionStatus,
  Prisma,
  XpEventReason,
} from '@prisma/client';
import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  LevelConfigSnapshot,
  LevelService,
} from '../common/services/level.service';
import { PrismaService } from '../database/prisma.service';
import { CompleteMiningSessionDto } from './dto/complete-mining-session.dto';
import { ListMiningSessionsDto } from './dto/list-mining-sessions.dto';
import { MiningSessionHeartbeatDto } from './dto/mining-session-heartbeat.dto';
import { StartMiningSessionDto } from './dto/start-mining-session.dto';
import { UpdateMiningPowerDto } from './dto/update-mining-power.dto';
import {
  aggregateTelemetryFromSamples,
  calculateCoinReward,
  calculateCommissionBreakdown,
  calculateMiningXp,
  calculateReferralEarning,
  MIN_HEARTBEATS_FOR_SETTLEMENT,
  MIN_SECONDS_REQUIRING_HEARTBEATS,
  resolveLevelForXp,
} from './gamification.utils';

@Injectable()
export class GamificationService {
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

    const [
      configs,
      recentXpEvents,
      recentCoinTransactions,
      miningSummary,
      completedSessions,
      activeSession,
    ] = await Promise.all([
        this.levelService.getAllLevelConfigs(),
        this.prisma.xpEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.coinTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.miningSession.aggregate({
          where: { userId, status: MiningSessionStatus.COMPLETED },
          _sum: {
            totalSeconds: true,
            secondsAbove80Percent: true,
            rawMinedValue: true,
            userRewardValue: true,
          },
        }),
        this.prisma.miningSession.count({
          where: { userId, status: MiningSessionStatus.COMPLETED },
        }),
        this.prisma.miningSession.findFirst({
          where: { userId, status: MiningSessionStatus.ACTIVE },
          orderBy: { startedAt: 'desc' },
        }),
      ]);

    const currentLevelConfig = this.getCurrentLevelConfig(configs, user.level);
    const nextLevelConfig = configs.find((config) => config.level === user.level + 1);
    const referralPercent =
      configs.find((config) => config.level === user.level)?.referralPercent ??
      configs.at(-1)?.referralPercent ??
      10;

    return {
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        referralCode: user.referralCode,
        miningPowerPercent: user.miningPowerPercent,
        referralsCount: user._count.referrals,
        createdAt: user.createdAt,
      },
      progression: {
        xp: user.xp,
        level: user.level,
        referralPercent,
        currentLevelXpFloor: currentLevelConfig?.xpRequired ?? 0,
        nextLevelXpTarget: nextLevelConfig?.xpRequired ?? null,
        xpToNextLevel: nextLevelConfig
          ? Math.max(0, nextLevelConfig.xpRequired - user.xp)
          : null,
      },
      wallet: {
        coinBalance: user.coinBalance.toString(),
      },
      mining: {
        completedSessions,
        totalSecondsMined: miningSummary._sum.totalSeconds ?? 0,
        totalBonusEligibleSeconds:
          miningSummary._sum.secondsAbove80Percent ?? 0,
        totalRawMinedValue:
          miningSummary._sum.rawMinedValue?.toString() ?? '0',
        totalRewardValue:
          miningSummary._sum.userRewardValue?.toString() ?? '0',
      },
      activeSession: activeSession
        ? {
            id: activeSession.id,
            startedAt: activeSession.startedAt,
            status: activeSession.status,
          }
        : null,
      recentXpEvents: recentXpEvents.map((event) => ({
        id: event.id,
        amount: event.amount,
        reason: event.reason,
        miningSessionId: event.miningSessionId,
        createdAt: event.createdAt,
      })),
      recentCoinTransactions: recentCoinTransactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount.toString(),
        type: transaction.type,
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
        balanceAfter: transaction.balanceAfter.toString(),
        createdAt: transaction.createdAt,
      })),
    };
  }

  async updateMiningPower(userId: string, dto: UpdateMiningPowerDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { miningPowerPercent: dto.miningPowerPercent },
    });

    return {
      miningPowerPercent: user.miningPowerPercent,
    };
  }

  async startMiningSession(userId: string, dto: StartMiningSessionDto) {
    return this.prisma.$transaction(async (tx) => {
      const [user, activeSession] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.miningSession.findFirst({
          where: { userId, status: MiningSessionStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (activeSession) {
        throw new ConflictException('User already has an active mining session');
      }

      if (dto.miningPowerPercent !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { miningPowerPercent: dto.miningPowerPercent },
        });
      }

      const session = await tx.miningSession.create({
        data: {
          userId,
          status: MiningSessionStatus.ACTIVE,
        },
      });

      return {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        miningPowerPercent:
          dto.miningPowerPercent ?? user.miningPowerPercent,
      };
    });
  }

  async recordHeartbeat(
    userId: string,
    sessionId: string,
    dto: MiningSessionHeartbeatDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.getActiveSessionForUser(tx, userId, sessionId);

      await tx.miningPowerSample.create({
        data: {
          sessionId: session.id,
          powerPercent: dto.powerPercent,
        },
      });

      const [samples, heartbeatCount] = await Promise.all([
        tx.miningPowerSample.findMany({
          where: { sessionId: session.id },
          orderBy: { recordedAt: 'asc' },
        }),
        tx.miningPowerSample.count({ where: { sessionId: session.id } }),
      ]);

      const telemetry = aggregateTelemetryFromSamples(
        session.startedAt,
        samples,
      );

      const updatedSession = await tx.miningSession.update({
        where: { id: session.id },
        data: {
          totalSeconds: telemetry.totalSeconds,
          secondsAbove80Percent: telemetry.secondsAbove80Percent,
          avgPowerPercent: telemetry.avgPowerPercent,
          peakPowerPercent: telemetry.peakPowerPercent,
          hashrate: dto.hashrate ?? session.hashrate,
          sharesAccepted: dto.sharesAccepted ?? session.sharesAccepted,
        },
      });

      return {
        sessionId: updatedSession.id,
        status: updatedSession.status,
        telemetry: {
          totalSeconds: updatedSession.totalSeconds,
          secondsAbove80Percent: updatedSession.secondsAbove80Percent,
          avgPowerPercent: updatedSession.avgPowerPercent.toString(),
          peakPowerPercent: updatedSession.peakPowerPercent.toString(),
          hashrate: updatedSession.hashrate?.toString() ?? null,
          sharesAccepted: updatedSession.sharesAccepted,
          heartbeatCount,
        },
      };
    });
  }

  async getSessionHistory(userId: string, query: ListMiningSessionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      status: MiningSessionStatus.COMPLETED,
    };

    const [sessions, total] = await Promise.all([
      this.prisma.miningSession.findMany({
        where,
        orderBy: { endedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          totalSeconds: true,
          hashrate: true,
          sharesAccepted: true,
          userRewardValue: true,
        },
      }),
      this.prisma.miningSession.count({ where }),
    ]);

    const sessionIds = sessions.map((session) => session.id);
    const coinTransactions =
      sessionIds.length > 0
        ? await this.prisma.coinTransaction.findMany({
            where: {
              userId,
              type: CoinTransactionType.MINING_REWARD,
              referenceType: 'mining_session',
              referenceId: { in: sessionIds },
            },
            select: {
              referenceId: true,
              amount: true,
            },
          })
        : [];

    const coinsBySession = new Map(
      coinTransactions.map((tx) => [tx.referenceId, tx.amount.toString()]),
    );

    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        totalSeconds: session.totalSeconds,
        hashrate: session.hashrate?.toString() ?? null,
        sharesAccepted: session.sharesAccepted ?? 0,
        coinsEarned:
          coinsBySession.get(session.id) ??
          calculateCoinReward(session.userRewardValue).toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async abortMiningSession(userId: string, sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.getActiveSessionForUser(tx, userId, sessionId);
      const endedAt = new Date();
      const samples = await tx.miningPowerSample.findMany({
        where: { sessionId: session.id },
        orderBy: { recordedAt: 'asc' },
      });
      const telemetry = aggregateTelemetryFromSamples(
        session.startedAt,
        samples,
        endedAt,
      );

      const updatedSession = await tx.miningSession.update({
        where: { id: session.id },
        data: {
          endedAt,
          status: MiningSessionStatus.ABORTED,
          totalSeconds: telemetry.totalSeconds,
          secondsAbove80Percent: telemetry.secondsAbove80Percent,
          avgPowerPercent: telemetry.avgPowerPercent,
          peakPowerPercent: telemetry.peakPowerPercent,
        },
      });

      return {
        session: {
          id: updatedSession.id,
          status: updatedSession.status,
          startedAt: updatedSession.startedAt,
          endedAt: updatedSession.endedAt,
          totalSeconds: updatedSession.totalSeconds,
          secondsAbove80Percent: updatedSession.secondsAbove80Percent,
        },
      };
    });
  }

  async completeMiningSession(
    userId: string,
    sessionId: string,
    dto: CompleteMiningSessionDto,
  ) {
    const levelConfigs = await this.levelService.getAllLevelConfigs();

    return this.prisma.$transaction(async (tx) => {
      const [user, session] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.miningSession.findUnique({ where: { id: sessionId } }),
      ]);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!session || session.userId !== userId) {
        throw new NotFoundException('Mining session not found');
      }

      if (session.status !== MiningSessionStatus.ACTIVE) {
        throw new ConflictException('Mining session has already been completed');
      }

      const endedAt = new Date();
      const samples = await tx.miningPowerSample.findMany({
        where: { sessionId: session.id },
        orderBy: { recordedAt: 'asc' },
      });
      const heartbeatCount = samples.length;
      const telemetry = aggregateTelemetryFromSamples(
        session.startedAt,
        samples,
        endedAt,
      );

      if (
        telemetry.totalSeconds >= MIN_SECONDS_REQUIRING_HEARTBEATS &&
        heartbeatCount < MIN_HEARTBEATS_FOR_SETTLEMENT
      ) {
        throw new BadRequestException(
          'Mining session is missing required telemetry heartbeats',
        );
      }

      const totalSeconds =
        heartbeatCount > 0 ? telemetry.totalSeconds : dto.totalSeconds;
      const secondsAbove80Percent =
        heartbeatCount > 0
          ? telemetry.secondsAbove80Percent
          : dto.secondsAbove80Percent;
      const avgPowerPercent =
        heartbeatCount > 0
          ? telemetry.avgPowerPercent
          : new Prisma.Decimal(dto.avgPowerPercent ?? 0);
      const peakPowerPercent =
        heartbeatCount > 0
          ? telemetry.peakPowerPercent
          : new Prisma.Decimal(dto.peakPowerPercent ?? 0);

      const xpEarned = calculateMiningXp(secondsAbove80Percent);
      const totalXp = user.xp + xpEarned;
      const newLevel = resolveLevelForXp(totalXp, levelConfigs);
      const breakdown = calculateCommissionBreakdown(dto.rawMinedValue);
      const coinAmount = calculateCoinReward(breakdown.userRewardValue);
      const balanceAfter = user.coinBalance.add(coinAmount);

      const updatedSession = await tx.miningSession.update({
        where: { id: session.id },
        data: {
          endedAt,
          totalSeconds,
          secondsAbove80Percent,
          avgPowerPercent,
          peakPowerPercent,
          hashrate: dto.hashrate ?? session.hashrate,
          sharesAccepted: dto.sharesAccepted ?? session.sharesAccepted,
          rawMinedValue: breakdown.rawMinedValue,
          platformCommission: breakdown.platformCommission,
          userRewardValue: breakdown.userRewardValue,
          status: MiningSessionStatus.COMPLETED,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          xp: totalXp,
          level: newLevel,
          coinBalance: balanceAfter,
        },
      });

      if (coinAmount.gt(0)) {
        await tx.coinTransaction.create({
          data: {
            userId,
            amount: coinAmount,
            type: CoinTransactionType.MINING_REWARD,
            referenceType: 'mining_session',
            referenceId: session.id,
            balanceAfter,
          },
        });
      }

      if (xpEarned > 0) {
        await tx.xpEvent.create({
          data: {
            userId,
            amount: xpEarned,
            reason: XpEventReason.MINING_HOUR_BONUS,
            miningSessionId: session.id,
          },
        });
      }

      let referralPayout: {
        referrerUserId: string;
        amountEarned: string;
        referrerRate: string;
      } | null = null;

      if (user.referredByUserId) {
        const referrer = await tx.user.findUnique({
          where: { id: user.referredByUserId },
        });

        if (referrer) {
          const referrerRatePercent = this.getReferralPercentForLevel(
            levelConfigs,
            referrer.level,
          );
          const referralEarning = calculateReferralEarning(
            breakdown.platformCommission,
            breakdown.userRewardValue,
            coinAmount,
            referrerRatePercent,
          );

          if (referralEarning) {
            const referrerBalanceAfter = referrer.coinBalance.add(
              referralEarning.amountEarned,
            );

            await tx.referralEarning.create({
              data: {
                referrerUserId: referrer.id,
                referredUserId: user.id,
                miningSessionId: session.id,
                commissionBase: referralEarning.commissionBase,
                referrerRate: referralEarning.referrerRate,
                amountEarned: referralEarning.amountEarned,
              },
            });

            await tx.user.update({
              where: { id: referrer.id },
              data: { coinBalance: referrerBalanceAfter },
            });

            await tx.coinTransaction.create({
              data: {
                userId: referrer.id,
                amount: referralEarning.amountEarned,
                type: CoinTransactionType.REFERRAL_EARNING,
                referenceType: 'mining_session',
                referenceId: session.id,
                balanceAfter: referrerBalanceAfter,
              },
            });

            referralPayout = {
              referrerUserId: referrer.id,
              amountEarned: referralEarning.amountEarned.toString(),
              referrerRate: referralEarning.referrerRate.toString(),
            };
          }
        }
      }

      const nextLevelConfig = levelConfigs.find(
        (config) => config.level === newLevel + 1,
      );

      return {
        session: {
          id: updatedSession.id,
          status: updatedSession.status,
          startedAt: updatedSession.startedAt,
          endedAt: updatedSession.endedAt,
          totalSeconds: updatedSession.totalSeconds,
          secondsAbove80Percent: updatedSession.secondsAbove80Percent,
          avgPowerPercent: updatedSession.avgPowerPercent.toString(),
          peakPowerPercent: updatedSession.peakPowerPercent.toString(),
          rawMinedValue: updatedSession.rawMinedValue.toString(),
          platformCommission: updatedSession.platformCommission.toString(),
          userRewardValue: updatedSession.userRewardValue.toString(),
        },
        rewards: {
          coinAmount: coinAmount.toString(),
          balanceAfter: updatedUser.coinBalance.toString(),
        },
        progression: {
          xpEarned,
          totalXp: updatedUser.xp,
          previousLevel: user.level,
          currentLevel: updatedUser.level,
          leveledUp: updatedUser.level > user.level,
          xpToNextLevel: nextLevelConfig
            ? Math.max(0, nextLevelConfig.xpRequired - updatedUser.xp)
            : null,
        },
        referral: referralPayout,
      };
    });
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

  private getReferralPercentForLevel(
    configs: LevelConfigSnapshot[],
    level: number,
  ): number {
    const config = this.getCurrentLevelConfig(configs, level);
    return config?.referralPercent ?? configs.at(-1)?.referralPercent ?? 10;
  }

  private async getActiveSessionForUser(
    tx: Prisma.TransactionClient,
    userId: string,
    sessionId: string,
  ) {
    const session = await tx.miningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Mining session not found');
    }

    if (session.status !== MiningSessionStatus.ACTIVE) {
      throw new ConflictException('Mining session is not active');
    }

    return session;
  }
}
