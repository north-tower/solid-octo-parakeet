import { ConflictException } from '@nestjs/common';
import { MiningSessionStatus, Prisma } from '@prisma/client';
import { LevelService } from '../common/services/level.service';
import { PrismaService } from '../database/prisma.service';
import { GamificationService } from './gamification.service';

describe('GamificationService', () => {
  const levelConfigs = [
    { level: 1, xpRequired: 0, referralPercent: 10 },
    { level: 2, xpRequired: 500, referralPercent: 12 },
    { level: 3, xpRequired: 1050, referralPercent: 14 },
    { level: 4, xpRequired: 1650, referralPercent: 16 },
  ];

  const createService = () => {
    const tx = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      miningSession: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      coinTransaction: {
        create: jest.fn(),
      },
      xpEvent: {
        create: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    } as unknown as PrismaService;

    const levelService = {
      getAllLevelConfigs: jest.fn().mockResolvedValue(levelConfigs),
    } as unknown as LevelService;

    return {
      service: new GamificationService(prisma, levelService),
      tx,
      levelService,
    };
  };

  it('settles a mining session with coins, xp, and a level up', async () => {
    const { service, tx } = createService();
    const user = {
      id: 'user-1',
      xp: 496,
      level: 1,
      coinBalance: new Prisma.Decimal('100'),
    };
    const session = {
      id: 'session-1',
      userId: 'user-1',
      status: MiningSessionStatus.ACTIVE,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    tx.user.findUnique.mockResolvedValue(user);
    tx.miningSession.findUnique.mockResolvedValue(session);
    tx.miningSession.update.mockImplementation(async ({ data }) => ({
      ...session,
      ...data,
      avgPowerPercent: new Prisma.Decimal(data.avgPowerPercent),
      peakPowerPercent: new Prisma.Decimal(data.peakPowerPercent),
      rawMinedValue: new Prisma.Decimal(data.rawMinedValue),
      platformCommission: new Prisma.Decimal(data.platformCommission),
      userRewardValue: new Prisma.Decimal(data.userRewardValue),
    }));
    tx.user.update.mockImplementation(async ({ data }) => ({
      ...user,
      ...data,
    }));

    const result = await service.completeMiningSession('user-1', 'session-1', {
      totalSeconds: 3600,
      secondsAbove80Percent: 3600,
      coinAmount: '25',
      rawMinedValue: '10',
      avgPowerPercent: 82,
      peakPowerPercent: 90,
      hashrate: '2500',
      sharesAccepted: 4,
    });

    expect(result.progression.xpEarned).toBe(5);
    expect(result.progression.currentLevel).toBe(2);
    expect(result.progression.leveledUp).toBe(true);
    expect(result.progression.xpToNextLevel).toBe(549);
    expect(result.rewards.balanceAfter).toBe('125');
    expect(result.session.platformCommission).toBe('2');
    expect(result.session.userRewardValue).toBe('8');
    expect(tx.coinTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.xpEvent.create).toHaveBeenCalledTimes(1);
  });

  it('skips xp events when there is no full bonus hour', async () => {
    const { service, tx } = createService();
    const user = {
      id: 'user-2',
      xp: 120,
      level: 1,
      coinBalance: new Prisma.Decimal('5'),
    };
    const session = {
      id: 'session-2',
      userId: 'user-2',
      status: MiningSessionStatus.ACTIVE,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    tx.user.findUnique.mockResolvedValue(user);
    tx.miningSession.findUnique.mockResolvedValue(session);
    tx.miningSession.update.mockImplementation(async ({ data }) => ({
      ...session,
      ...data,
      avgPowerPercent: new Prisma.Decimal(data.avgPowerPercent),
      peakPowerPercent: new Prisma.Decimal(data.peakPowerPercent),
      rawMinedValue: new Prisma.Decimal(data.rawMinedValue),
      platformCommission: new Prisma.Decimal(data.platformCommission),
      userRewardValue: new Prisma.Decimal(data.userRewardValue),
    }));
    tx.user.update.mockImplementation(async ({ data }) => ({
      ...user,
      ...data,
    }));

    const result = await service.completeMiningSession('user-2', 'session-2', {
      totalSeconds: 3599,
      secondsAbove80Percent: 3599,
      coinAmount: '3',
      avgPowerPercent: 79.5,
      peakPowerPercent: 80,
    });

    expect(result.progression.xpEarned).toBe(0);
    expect(result.progression.currentLevel).toBe(1);
    expect(result.rewards.balanceAfter).toBe('8');
    expect(tx.coinTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.xpEvent.create).not.toHaveBeenCalled();
  });

  it('rejects completion for a non-active session', async () => {
    const { service, tx } = createService();

    tx.user.findUnique.mockResolvedValue({
      id: 'user-3',
      xp: 0,
      level: 1,
      coinBalance: new Prisma.Decimal('0'),
    });
    tx.miningSession.findUnique.mockResolvedValue({
      id: 'session-3',
      userId: 'user-3',
      status: MiningSessionStatus.COMPLETED,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(
      service.completeMiningSession('user-3', 'session-3', {
        totalSeconds: 3600,
        secondsAbove80Percent: 3600,
        coinAmount: '1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
