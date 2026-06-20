import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CoinTransactionType,
  Prisma,
  RewardCatalog,
  RewardRequest,
  RewardRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { FulfillRewardRequestDto } from './dto/fulfill-reward-request.dto';
import { RejectRewardRequestDto } from './dto/reject-reward-request.dto';

type RewardRequestWithCatalog = RewardRequest & {
  catalogItem: RewardCatalog;
};

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listGames() {
    const games = await this.prisma.rewardCatalog.groupBy({
      by: ['gameSlug'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { gameSlug: 'asc' },
    });

    return {
      games: games.map((game) => ({
        gameSlug: game.gameSlug,
        itemCount: game._count.id,
      })),
    };
  }

  async listCatalogByGame(gameSlug: string) {
    const items = await this.prisma.rewardCatalog.findMany({
      where: {
        gameSlug: gameSlug.toLowerCase(),
        isActive: true,
      },
      orderBy: [{ coinCost: 'asc' }, { name: 'asc' }],
    });

    return {
      gameSlug: gameSlug.toLowerCase(),
      items: items.map((item) => this.mapCatalogItem(item)),
    };
  }

  async createRewardRequest(userId: string, dto: CreateRewardRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const [user, catalogItem] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.rewardCatalog.findUnique({ where: { id: dto.catalogItemId } }),
      ]);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!catalogItem || !catalogItem.isActive) {
        throw new NotFoundException('Reward catalog item not found');
      }

      if (user.coinBalance.lt(catalogItem.coinCost)) {
        throw new BadRequestException('Insufficient coin balance for redemption');
      }

      const request = await tx.rewardRequest.create({
        data: {
          userId,
          catalogItemId: catalogItem.id,
          coinCost: catalogItem.coinCost,
          status: RewardRequestStatus.PENDING,
        },
        include: { catalogItem: true },
      });

      return {
        request: this.mapRewardRequest(request),
        wallet: {
          coinBalance: user.coinBalance.toString(),
        },
      };
    });
  }

  async listMyRewardRequests(userId: string) {
    const requests = await this.prisma.rewardRequest.findMany({
      where: { userId },
      include: { catalogItem: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      requests: requests.map((request) => this.mapRewardRequest(request)),
    };
  }

  async listFulfillmentRequests(
    status: RewardRequestStatus = RewardRequestStatus.PENDING,
  ) {
    const requests = await this.prisma.rewardRequest.findMany({
      where: { status },
      include: {
        catalogItem: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            coinBalance: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      requests: requests.map((request) => ({
        ...this.mapRewardRequest(request),
        user: {
          id: request.user.id,
          email: request.user.email,
          displayName: request.user.displayName,
          coinBalance: request.user.coinBalance.toString(),
        },
      })),
    };
  }

  async fulfillRewardRequest(requestId: string, dto: FulfillRewardRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rewardRequest.findUnique({
        where: { id: requestId },
        include: { catalogItem: true },
      });

      if (!request) {
        throw new NotFoundException('Reward request not found');
      }

      if (request.status !== RewardRequestStatus.PENDING) {
        throw new ConflictException('Reward request has already been processed');
      }

      const user = await tx.user.findUnique({ where: { id: request.userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.coinBalance.lt(request.coinCost)) {
        throw new BadRequestException(
          'User no longer has enough coins to fulfill this request',
        );
      }

      const balanceAfter = user.coinBalance.sub(request.coinCost);
      const fulfilledAt = new Date();

      const updatedRequest = await tx.rewardRequest.update({
        where: { id: request.id },
        data: {
          status: RewardRequestStatus.FULFILLED,
          fulfillmentNotes: dto.fulfillmentNotes,
          fulfilledAt,
        },
        include: { catalogItem: true },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { coinBalance: balanceAfter },
      });

      await tx.coinTransaction.create({
        data: {
          userId: user.id,
          amount: request.coinCost.neg(),
          type: CoinTransactionType.REWARD_REDEMPTION,
          referenceType: 'reward_request',
          referenceId: request.id,
          balanceAfter,
        },
      });

      return {
        request: this.mapRewardRequest(updatedRequest),
        wallet: {
          coinBalance: balanceAfter.toString(),
        },
      };
    });
  }

  async rejectRewardRequest(requestId: string, dto: RejectRewardRequestDto) {
    const request = await this.prisma.rewardRequest.findUnique({
      where: { id: requestId },
      include: { catalogItem: true },
    });

    if (!request) {
      throw new NotFoundException('Reward request not found');
    }

    if (request.status !== RewardRequestStatus.PENDING) {
      throw new ConflictException('Reward request has already been processed');
    }

    const updatedRequest = await this.prisma.rewardRequest.update({
      where: { id: request.id },
      data: {
        status: RewardRequestStatus.REJECTED,
        fulfillmentNotes: dto.fulfillmentNotes,
      },
      include: { catalogItem: true },
    });

    return {
      request: this.mapRewardRequest(updatedRequest),
    };
  }

  private mapCatalogItem(item: RewardCatalog) {
    return {
      id: item.id,
      gameSlug: item.gameSlug,
      name: item.name,
      coinCost: item.coinCost.toString(),
      metadata: item.metadata,
    };
  }

  private mapRewardRequest(request: RewardRequestWithCatalog) {
    return {
      id: request.id,
      status: request.status,
      coinCost: request.coinCost.toString(),
      fulfillmentNotes: request.fulfillmentNotes,
      createdAt: request.createdAt,
      fulfilledAt: request.fulfilledAt,
      catalogItem: this.mapCatalogItem(request.catalogItem),
    };
  }
}
