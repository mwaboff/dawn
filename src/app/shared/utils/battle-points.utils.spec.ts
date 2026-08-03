import { suggestedBudget, spentPoints, pointCostForType, AdversaryTypeKey, BattlePointAdjustments, BattlePointAdversaryInstance } from './battle-points.utils';

function minions(count: number): BattlePointAdversaryInstance[] {
  return Array.from({ length: count }, () => ({ adversaryType: 'MINION' as const }));
}

function instance(adversaryType: AdversaryTypeKey): BattlePointAdversaryInstance {
  return { adversaryType };
}

describe('suggestedBudget', () => {
  it('computes (3 * partySize) + 2 with no adjustments', () => {
    expect(suggestedBudget(4)).toBe(14);
  });

  it('defaults adjustments to none when omitted', () => {
    expect(suggestedBudget(4)).toBe(suggestedBudget(4, {}));
  });

  it('handles party size 0', () => {
    expect(suggestedBudget(0)).toBe(2);
  });

  it.each<[keyof BattlePointAdjustments, number]>([
    ['easier', -1],
    ['twoPlusSolos', -2],
    ['bonusDamage', -2],
    ['lowerTier', 1],
    ['noElites', 1],
    ['harder', 2],
  ])('applies the %s adjustment alone as a delta of %d', (key, delta) => {
    expect(suggestedBudget(4, { [key]: true })).toBe(14 + delta);
  });

  it('sums all six adjustments when combined', () => {
    const total = suggestedBudget(4, {
      easier: true,
      twoPlusSolos: true,
      bonusDamage: true,
      lowerTier: true,
      noElites: true,
      harder: true,
    });
    expect(total).toBe(14 + (-1 - 2 - 2 + 1 + 1 + 2));
  });
});

describe('spentPoints', () => {
  it('returns 0 for an empty encounter', () => {
    expect(spentPoints([], 4)).toBe(0);
  });

  it.each([
    [1, 1, 1],
    [1, 2, 1],
    [4, 4, 1],
    [5, 4, 2],
    [8, 4, 2],
    [9, 4, 3],
    [6, 5, 2],
    [6, 6, 1],
  ])('groups %d minions at party size %d into %d point(s)', (minionCount, partySize, expected) => {
    expect(spentPoints(minions(minionCount), partySize)).toBe(expected);
  });

  it('treats party size 0 as 1 for minion grouping', () => {
    expect(spentPoints(minions(3), 0)).toBe(3);
  });

  it.each<[AdversaryTypeKey, number]>([
    ['MINION', 1],
    ['SOCIAL', 1],
    ['SUPPORT', 1],
    ['HORDE', 2],
    ['RANGED', 2],
    ['SKULK', 2],
    ['STANDARD', 2],
    ['LEADER', 3],
    ['BRUISER', 4],
    ['SOLO', 5],
  ])('charges %s at %d point(s) per instance', (type, cost) => {
    if (type === 'MINION') {
      expect(spentPoints(minions(4), 4)).toBe(1);
      return;
    }
    expect(spentPoints([instance(type)], 4)).toBe(cost);
  });

  it('sums non-minion instances independently of party size', () => {
    expect(spentPoints([instance('BRUISER'), instance('STANDARD')], 4)).toBe(6);
  });

  it('matches the rulebook worked example: two Bruisers, two Standards, four Minions at party size 4', () => {
    const encounter = [
      instance('BRUISER'),
      instance('BRUISER'),
      instance('STANDARD'),
      instance('STANDARD'),
      ...minions(4),
    ];
    expect(spentPoints(encounter, 4)).toBe(13);
    expect(suggestedBudget(4)).toBe(14);
  });
});

describe('pointCostForType', () => {
  it.each<[Exclude<AdversaryTypeKey, 'MINION'>, number]>([
    ['SOCIAL', 1],
    ['SUPPORT', 1],
    ['HORDE', 2],
    ['RANGED', 2],
    ['SKULK', 2],
    ['STANDARD', 2],
    ['LEADER', 3],
    ['BRUISER', 4],
    ['SOLO', 5],
  ])('returns the per-instance cost for %s', (type, cost) => {
    expect(pointCostForType(type)).toBe(cost);
  });
});
