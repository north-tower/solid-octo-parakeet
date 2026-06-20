import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  CoinTransactionType,
  Prisma,
  RewardRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RewardsService } from './rewards.service';

describe('RewardsService', () => {
  const catalogItem = {
    id: 'catalog-1',
    gameSlug: 'steam',
    name: 'Steam Gift Card — $10',
    coinCost: new Prisma.Decimal('1000'),
    isActive: true,
    metadata: null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  };

  const createService = () => {
    const tx = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      rewardCatalog: {
        findUnique: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      rewardRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      coinTransaction: {
        create: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
      rewardCatalog: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      rewardRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    return {
      service: new RewardsService(prisma),
      tx,
      prisma,
    };
  };

  it('lists active games from the catalog', async () => {
    const { service, prisma } = createService();

    prisma.rewardCatalog.groupBy.mockResolvedValue([
      { gameSlug: 'fifa', _count: { id: 1 } },
      { gameSlug: 'steam', _count: { id: 1 } },
    ]);

    const result = await service.listGames();

    expect(result.games).toEqual([
      { gameSlug: 'fifa', itemCount: 1 },
      { gameSlug: 'steam', itemCount: 1 },
    ]);
  });

  it('creates a pending reward request when the user has enough coins', async () => {
    const { service, tx } = createService();
    const user = {
      id: 'user-1',
      coinBalance: new Prisma.Decimal('1500'),
    };
    const request = {
      id: 'request-1',
      userId: 'user-1',
      catalogItemId: catalogItem.id,
      coinCost: catalogItem.coinCost,
      status: RewardRequestStatus.PENDING,
      fulfillmentNotes: null,
      createdAt: new Date('2026-06-12T10:00:00.000Z'),
      fulfilledAt: null,
      catalogItem,
    };

    tx.user.findUnique.mockResolvedValue(user);
    tx.rewardCatalog.findUnique.mockResolvedValue(catalogItem);
    tx.rewardRequest.create.mockResolvedValue(request);

    const result = await service.createRewardRequest('user-1', {
      catalogItemId: catalogItem.id,
    });

    expect(result.request.status).toBe(RewardRequestStatus.PENDING);
    expect(result.request.coinCost).toBe('1000');
    expect(result.wallet.coinBalance).toBe('1500');
  });

  it('rejects reward requests when balance is too low', async () => {
    const { service, tx } = createService();

    tx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      coinBalance: new Prisma.Decimal('100'),
    });
    tx.rewardCatalog.findUnique.mockResolvedValue(catalogItem);

    await expect(
      service.createRewardRequest('user-1', { catalogItemId: catalogItem.id }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fulfills a pending request and deducts coins', async () => {
    const { service, tx } = createService();
    const user = {
      id: 'user-1',
      coinBalance: new Prisma.Decimal('1500'),
    };
    const pendingRequest = {
      id: 'request-1',
      userId: 'user-1',
      catalogItemId: catalogItem.id,
      coinCost: catalogItem.coinCost,
      status: RewardRequestStatus.PENDING,
      fulfillmentNotes: null,
      createdAt: new Date('2026-06-12T10:00:00.000Z'),
      fulfilledAt: null,
      catalogItem,
    };

    tx.rewardRequest.findUnique.mockResolvedValue(pendingRequest);
    tx.user.findUnique.mockResolvedValue(user);
    tx.rewardRequest.update.mockResolvedValue({
      ...pendingRequest,
      status: RewardRequestStatus.FULFILLED,
      fulfillmentNotes: 'Code sent',
      fulfilledAt: new Date('2026-06-12T12:00:00.000Z'),
    });

    const result = await service.fulfillRewardRequest('request-1', {
      fulfillmentNotes: 'Code sent',
    });

    expect(result.request.status).toBe(RewardRequestStatus.FULFILLED);
    expect(result.wallet.coinBalance).toBe('500');
    expect(tx.coinTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        amount: new Prisma.Decimal('-1000'),
        type: CoinTransactionType.REWARD_REDEMPTION,
        referenceType: 'reward_request',
        referenceId: 'request-1',
        balanceAfter: new Prisma.Decimal('500'),
      },
    });
  });

  it('rejects fulfillment when the request is not pending', async () => {
    const { service, tx } = createService();

    tx.rewardRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      catalogItemId: catalogItem.id,
      coinCost: catalogItem.coinCost,
      status: RewardRequestStatus.FULFILLED,
      fulfillmentNotes: null,
      createdAt: new Date('2026-06-12T10:00:00.000Z'),
      fulfilledAt: new Date('2026-06-12T12:00:00.000Z'),
      catalogItem,
    });

    await expect(
      service.fulfillRewardRequest('request-1', {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a pending request without deducting coins', async () => {
    const { service, prisma } = createService();
    const pendingRequest = {
      id: 'request-1',
      userId: 'user-1',
      catalogItemId: catalogItem.id,
      coinCost: catalogItem.coinCost,
      status: RewardRequestStatus.PENDING,
      fulfillmentNotes: null,
      createdAt: new Date('2026-06-12T10:00:00.000Z'),
      fulfilledAt: null,
      catalogItem,
    };

    prisma.rewardRequest.findUnique.mockResolvedValue(pendingRequest);
    prisma.rewardRequest.update.mockResolvedValue({
      ...pendingRequest,
      status: RewardRequestStatus.REJECTED,
      fulfillmentNotes: 'Out of stock',
    });

    const result = await service.rejectRewardRequest('request-1', {
      fulfillmentNotes: 'Out of stock',
    });

    expect(result.request.status).toBe(RewardRequestStatus.REJECTED);
  });

  it('throws when rejecting a missing request', async () => {
    const { service, prisma } = createService();
    prisma.rewardRequest.findUnique.mockResolvedValue(null);

    await expect(
      service.rejectRewardRequest('missing-request', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
