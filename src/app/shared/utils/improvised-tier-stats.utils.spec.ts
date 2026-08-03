import { improvisedTierStats } from './improvised-tier-stats.utils';

describe('improvisedTierStats', () => {
  it('returns Tier 1 stats', () => {
    expect(improvisedTierStats(1)).toEqual({
      tier: 1,
      attackModifier: 1,
      damageDiceDisplay: '1d6+2 to 1d12+4',
      difficulty: 11,
      majorThreshold: 7,
      severeThreshold: 12,
    });
  });

  it('returns Tier 2 stats', () => {
    expect(improvisedTierStats(2)).toEqual({
      tier: 2,
      attackModifier: 2,
      damageDiceDisplay: '2d6+3 to 2d12+4',
      difficulty: 14,
      majorThreshold: 10,
      severeThreshold: 20,
    });
  });

  it('returns Tier 3 stats', () => {
    expect(improvisedTierStats(3)).toEqual({
      tier: 3,
      attackModifier: 3,
      damageDiceDisplay: '3d8+3 to 3d12+5',
      difficulty: 17,
      majorThreshold: 20,
      severeThreshold: 32,
    });
  });

  it('returns Tier 4 stats', () => {
    expect(improvisedTierStats(4)).toEqual({
      tier: 4,
      attackModifier: 4,
      damageDiceDisplay: '4d8+10 to 4d12+15',
      difficulty: 20,
      majorThreshold: 25,
      severeThreshold: 45,
    });
  });

  it('returns undefined for tier 0', () => {
    expect(improvisedTierStats(0)).toBeUndefined();
  });

  it('returns undefined for tier 5', () => {
    expect(improvisedTierStats(5)).toBeUndefined();
  });

  it('returns undefined for a negative tier', () => {
    expect(improvisedTierStats(-1)).toBeUndefined();
  });

  it('returns undefined for a non-integer tier', () => {
    expect(improvisedTierStats(1.5)).toBeUndefined();
  });

  it('returns undefined for NaN', () => {
    expect(improvisedTierStats(NaN)).toBeUndefined();
  });
});
