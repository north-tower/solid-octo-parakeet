import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LevelService } from '../common/services/level.service';
import { PrismaService } from '../database/prisma.service';
import { ReferralsService } from './referrals.service';

describe('ReferralsService', () => {
  const levelConfigs = [
    { level: 1, xpRequired: 0, referralPercent: 10 },
    { level: 2, xpRequired: 500, referralPercent: 12 },
    { level: 3, xpRequired: 1050, referralPercent: 14 },
  ];

  const createService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      referralEarning: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as PrismaService;

    const levelService = {
      getAllLevelConfigs: jest.fn().mockResolvedValue(levelConfigs),
    } as unknown as LevelService;

    return {
      service: new ReferralsService(prisma, levelService),
      prisma,
    };
  };

  it('returns referral dashboard data for the current user', async () => {
    const { service, prisma } = createService();

    prisma.user.findUnique.mockResolvedValue({
      id: 'referrer-1',
      referralCode: 'AB12CD34',
      level: 2,
      xp: 600,
      _count: { referrals: 1 },
    });
    prisma.referralEarning.aggregate.mockResolvedValue({
      _sum: { amountEarned: new Prisma.Decimal('3.5') },
      _count: 2,
    });
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'referred-1',
        displayName: 'NightRaider',
        email: 'player@example.com',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        referralEarningsAsReferred: [
          { amountEarned: new Prisma.Decimal('2') },
          { amountEarned: new Prisma.Decimal('1.5') },
        ],
      },
    ]);
    prisma.referralEarning.findMany.mockResolvedValue([
      {
        id: 'earning-1',
        amountEarned: new Prisma.Decimal('1.5'),
        commissionBase: new Prisma.Decimal('2'),
        referrerRate: new Prisma.Decimal('12'),
        miningSessionId: 'session-1',
        createdAt: new Date('2026-06-12T13:00:00.000Z'),
        referred: {
          id: 'referred-1',
          displayName: 'NightRaider',
          email: 'player@example.com',
        },
      },
    ]);

    const result = await service.getDashboard('referrer-1');

    expect(result.profile).toEqual({
      referralCode: 'AB12CD34',
      referralsCount: 1,
    });
    expect(result.progression.referralPercent).toBe(12);
    expect(result.progression.nextLevelReferralPercent).toBe(14);
    expect(result.progression.xpToNextLevel).toBe(450);
    expect(result.earnings).toEqual({
      totalEarned: '3.5',
      totalSessions: 2,
    });
    expect(result.referredUsers[0].totalEarnedFromUser).toBe('3.5');
    expect(result.referredUsers[0].sessionsCount).toBe(2);
    expect(result.recentEarnings).toHaveLength(1);
  });

  it('throws when the user does not exist', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getDashboard('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
