import { Prisma } from '@prisma/client';
import { LevelConfigSnapshot } from '../common/services/level.service';

export const XP_PER_QUALIFIED_HOUR = 5;
export const QUALIFIED_MINING_SECONDS = 60 * 60;
export const PLATFORM_COMMISSION_RATE = new Prisma.Decimal('0.20');

export function calculateMiningXp(secondsAbove80Percent: number): number {
  const qualifiedHours = Math.floor(
    Math.max(0, secondsAbove80Percent) / QUALIFIED_MINING_SECONDS,
  );

  return qualifiedHours * XP_PER_QUALIFIED_HOUR;
}

export function resolveLevelForXp(
  totalXp: number,
  configs: LevelConfigSnapshot[],
): number {
  return (
    configs
      .filter((config) => totalXp >= config.xpRequired)
      .at(-1)?.level ?? 1
  );
}

export function calculateCommissionBreakdown(rawMinedValue: Prisma.Decimal.Value) {
  const rawValue = new Prisma.Decimal(rawMinedValue);
  const platformCommission = rawValue.mul(PLATFORM_COMMISSION_RATE);
  const userRewardValue = rawValue.sub(platformCommission);

  return {
    rawMinedValue: rawValue,
    platformCommission,
    userRewardValue,
  };
}
