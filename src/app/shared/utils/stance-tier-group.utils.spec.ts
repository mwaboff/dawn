import { describe, it, expect } from 'vitest';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { stanceTier, groupStancesByTier } from './stance-tier-group.utils';

function stance(name: string, tier?: number): CardData {
  return {
    id: name.length,
    name,
    description: '',
    cardType: 'martialStance',
    metadata: tier === undefined ? {} : { tier },
  } as unknown as CardData;
}

describe('stanceTier', () => {
  it('reads the printed tier from card metadata', () => {
    expect(stanceTier(stance('Favored', 1))).toBe(1);
  });

  it('returns 0 when tier metadata is absent', () => {
    expect(stanceTier(stance('Unknown'))).toBe(0);
  });
});

describe('groupStancesByTier', () => {
  it('returns an empty array for no stances', () => {
    expect(groupStancesByTier([])).toEqual([]);
  });

  it('orders tiers ascending regardless of input order', () => {
    const groups = groupStancesByTier([stance('Crushing', 4), stance('Favored', 1), stance('Anchored', 2)]);
    expect(groups.map(g => g.tier)).toEqual([1, 2, 4]);
  });

  it('sorts stances within a tier by name', () => {
    const groups = groupStancesByTier([stance('Reliable', 1), stance('Favored', 1), stance('Invigorating', 1)]);
    expect(groups[0].stances.map(s => s.name)).toEqual(['Favored', 'Invigorating', 'Reliable']);
  });

  it('does not mutate the input array order', () => {
    const input = [stance('Reliable', 1), stance('Favored', 1)];
    groupStancesByTier(input);
    expect(input.map(s => s.name)).toEqual(['Reliable', 'Favored']);
  });

  it('groups every stance exactly once', () => {
    const input = [stance('Favored', 1), stance('Anchored', 2), stance('Scary', 3), stance('Honed', 4)];
    const total = groupStancesByTier(input).reduce((n, g) => n + g.stances.length, 0);
    expect(total).toBe(input.length);
  });
});
