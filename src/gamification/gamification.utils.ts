import { Prisma } from '@prisma/client';
import { LevelConfigSnapshot } from '../common/services/level.service';

export const XP_PER_QUALIFIED_HOUR = 5;
export const QUALIFIED_MINING_SECONDS = 60 * 60;
export const PLATFORM_COMMISSION_RATE = new Prisma.Decimal('0.20');
export const COINS_PER_USER_REWARD_UNIT = new Prisma.Decimal('3.125');
export const QUALIFIED_POWER_PERCENT = 80;
export const MIN_HEARTBEATS_FOR_SETTLEMENT = 1;
export const MIN_SECONDS_REQUIRING_HEARTBEATS = 60;

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

export function calculateCoinReward(
  userRewardValue: Prisma.Decimal,
): Prisma.Decimal {
  return userRewardValue.mul(COINS_PER_USER_REWARD_UNIT);
}

export interface PowerSamplePoint {
  recordedAt: Date;
  powerPercent: Prisma.Decimal.Value;
}

export interface SessionTelemetryAggregate {
  totalSeconds: number;
  secondsAbove80Percent: number;
  avgPowerPercent: Prisma.Decimal;
  peakPowerPercent: Prisma.Decimal;
}

export function aggregateTelemetryFromSamples(
  startedAt: Date,
  samples: PowerSamplePoint[],
  endedAt: Date = new Date(),
): SessionTelemetryAggregate {
  const sortedSamples = [...samples].sort(
    (left, right) => left.recordedAt.getTime() - right.recordedAt.getTime(),
  );
  const totalSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
  );

  if (sortedSamples.length === 0) {
    return {
      totalSeconds,
      secondsAbove80Percent: 0,
      avgPowerPercent: new Prisma.Decimal(0),
      peakPowerPercent: new Prisma.Decimal(0),
    };
  }

  let secondsAbove80Percent = 0;
  let weightedPowerSum = new Prisma.Decimal(0);
  let peakPowerPercent = new Prisma.Decimal(0);

  const accumulateInterval = (
    intervalStart: Date,
    intervalEnd: Date,
    power: Prisma.Decimal,
  ) => {
    const intervalSeconds = Math.max(
      0,
      Math.floor((intervalEnd.getTime() - intervalStart.getTime()) / 1000),
    );

    if (power.gte(QUALIFIED_POWER_PERCENT)) {
      secondsAbove80Percent += intervalSeconds;
    }

    weightedPowerSum = weightedPowerSum.add(power.mul(intervalSeconds));

    if (power.gt(peakPowerPercent)) {
      peakPowerPercent = power;
    }
  };

  for (let index = 0; index < sortedSamples.length; index++) {
    const sample = sortedSamples[index];
    const power = new Prisma.Decimal(sample.powerPercent);
    const intervalStart =
      index === 0 ? startedAt : sortedSamples[index - 1].recordedAt;

    accumulateInterval(intervalStart, sample.recordedAt, power);
  }

  const lastSample = sortedSamples[sortedSamples.length - 1];
  accumulateInterval(
    lastSample.recordedAt,
    endedAt,
    new Prisma.Decimal(lastSample.powerPercent),
  );

  return {
    totalSeconds,
    secondsAbove80Percent,
    avgPowerPercent:
      totalSeconds > 0
        ? weightedPowerSum.div(totalSeconds)
        : new Prisma.Decimal(0),
    peakPowerPercent,
  };
}

export interface ReferralEarningBreakdown {
  commissionBase: Prisma.Decimal;
  referrerRate: Prisma.Decimal;
  amountEarned: Prisma.Decimal;
}

export function calculateReferralEarning(
  platformCommission: Prisma.Decimal,
  userRewardValue: Prisma.Decimal,
  coinAmount: Prisma.Decimal,
  referrerRatePercent: number,
): ReferralEarningBreakdown | null {
  if (referrerRatePercent <= 0 || platformCommission.lte(0)) {
    return null;
  }

  const referrerRate = new Prisma.Decimal(referrerRatePercent);
  const commissionBase = platformCommission;

  const platformCommissionCoins = userRewardValue.gt(0)
    ? coinAmount.mul(platformCommission).div(userRewardValue)
    : new Prisma.Decimal(0);

  const amountEarned = platformCommissionCoins.mul(referrerRate).div(100);

  if (amountEarned.lte(0)) {
    return null;
  }

  return {
    commissionBase,
    referrerRate,
    amountEarned,
  };
}
