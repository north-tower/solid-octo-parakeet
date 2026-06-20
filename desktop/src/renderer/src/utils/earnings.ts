import {
  COINS_PER_USER_REWARD_UNIT,
  RAW_VALUE_PER_HOUR_AT_FULL_POWER,
} from '@shared/constants';

const PLATFORM_COMMISSION = 0.2;
const USER_REWARD_RATE = 1 - PLATFORM_COMMISSION;

export function estimateCoinsEarned(
  totalSeconds: number,
  avgPowerPercent: number,
): number {
  const hours = totalSeconds / 3600;
  const raw = hours * (avgPowerPercent / 100) * RAW_VALUE_PER_HOUR_AT_FULL_POWER;
  const userReward = raw * USER_REWARD_RATE;
  return userReward * COINS_PER_USER_REWARD_UNIT;
}

export function estimateCoinsInMinutes(
  minutes: number,
  powerPercent: number,
): number {
  return estimateCoinsEarned(minutes * 60, powerPercent);
}

export function formatEstimatedCoins(value: number) {
  if (value < 0.0001) {
    return value.toFixed(6);
  }
  if (value < 1) {
    return value.toFixed(4);
  }
  return value.toFixed(2);
}
