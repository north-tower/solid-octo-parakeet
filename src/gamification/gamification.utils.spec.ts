import { LevelConfigSnapshot } from '../common/services/level.service';
import {
  calculateCommissionBreakdown,
  calculateMiningXp,
  resolveLevelForXp,
} from './gamification.utils';

describe('gamification utils', () => {
  const levels: LevelConfigSnapshot[] = [
    { level: 1, xpRequired: 0, referralPercent: 10 },
    { level: 2, xpRequired: 500, referralPercent: 12 },
    { level: 3, xpRequired: 1050, referralPercent: 14 },
    { level: 4, xpRequired: 1650, referralPercent: 16 },
  ];

  it('awards 5 xp for each full qualified hour above 80 percent', () => {
    expect(calculateMiningXp(3599)).toBe(0);
    expect(calculateMiningXp(3600)).toBe(5);
    expect(calculateMiningXp(10800)).toBe(15);
  });

  it('resolves the highest eligible level from total xp', () => {
    expect(resolveLevelForXp(0, levels)).toBe(1);
    expect(resolveLevelForXp(1049, levels)).toBe(2);
    expect(resolveLevelForXp(1650, levels)).toBe(4);
  });

  it('splits mining value into platform commission and user reward', () => {
    const breakdown = calculateCommissionBreakdown('25');

    expect(breakdown.rawMinedValue.toString()).toBe('25');
    expect(breakdown.platformCommission.toString()).toBe('5');
    expect(breakdown.userRewardValue.toString()).toBe('20');
  });
});
