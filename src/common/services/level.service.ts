import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface LevelConfigSnapshot {
  level: number;
  xpRequired: number;
  referralPercent: number;
}

@Injectable()
export class LevelService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllLevelConfigs(): Promise<LevelConfigSnapshot[]> {
    const configs = await this.prisma.levelConfig.findMany({
      orderBy: { level: 'asc' },
    });

    return configs.map((config) => ({
      level: config.level,
      xpRequired: config.xpRequired,
      referralPercent: Number(config.referralPercent),
    }));
  }

  async getReferralPercent(level: number): Promise<number> {
    const configs = await this.getAllLevelConfigs();
    const exactConfig = configs.find((config) => config.level === level);

    if (exactConfig) {
      return exactConfig.referralPercent;
    }

    return configs.at(-1)?.referralPercent ?? 10;
  }

  async getXpToNextLevel(
    currentLevel: number,
    currentXp: number,
  ): Promise<number | null> {
    const nextLevel = await this.prisma.levelConfig.findUnique({
      where: { level: currentLevel + 1 },
    });

    if (!nextLevel) {
      return null;
    }

    return Math.max(0, nextLevel.xpRequired - currentXp);
  }

  async getLevelForXp(totalXp: number): Promise<number> {
    const configs = await this.getAllLevelConfigs();
    return this.resolveLevelForXp(totalXp, configs);
  }

  resolveLevelForXp(totalXp: number, configs: LevelConfigSnapshot[]): number {
    return (
      configs
        .filter((config) => totalXp >= config.xpRequired)
        .at(-1)?.level ?? 1
    );
  }
}
