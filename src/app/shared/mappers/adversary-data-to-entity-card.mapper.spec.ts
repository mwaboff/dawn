import { describe, it, expect } from 'vitest';
import { adversaryToEntityCard } from './adversary-data-to-entity-card.mapper';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';

function buildAdversary(overrides: Partial<AdversaryData> = {}): AdversaryData {
  return {
    id: 1,
    name: 'Acid Burrower',
    tier: 1,
    adversaryType: 'SOLO',
    ...overrides,
  };
}

describe('adversaryToEntityCard', () => {
  it('maps id, name, and cardType', () => {
    const result = adversaryToEntityCard(buildAdversary({ id: 42, name: 'Goblin Scout' }));

    expect(result.id).toBe(42);
    expect(result.name).toBe('Goblin Scout');
    expect(result.cardType).toBe('adversary');
  });

  it('leaves the eyebrow unset so the type tab reads "Adversary" rather than the subtype', () => {
    const result = adversaryToEntityCard(buildAdversary({ adversaryType: 'BRUISER' }));

    expect(result.eyebrow).toBeUndefined();
  });

  it('title-cases the adversary type into the subtitle rather than printing the raw enum', () => {
    const result = adversaryToEntityCard(buildAdversary({ adversaryType: 'BRUISER' }));

    expect(result.subtitle).toBe('Bruiser');
  });

  it('leads the badges with the tier as a label/value chip', () => {
    const result = adversaryToEntityCard(buildAdversary({ tier: 3 }));

    expect(result.badges).toEqual([{ label: 'Tier', value: '3' }]);
  });

  it('keeps Difficulty out of the headline, so compact shows the adversary type instead', () => {
    const result = adversaryToEntityCard(buildAdversary({ difficulty: 15 }));

    expect(result.headline).toBeUndefined();
    expect(result.stats).toContainEqual({ label: 'Difficulty', value: '15' });
  });

  it('leaves the headline unset when difficulty is not provided', () => {
    const result = adversaryToEntityCard(buildAdversary({ difficulty: undefined }));

    expect(result.headline).toBeUndefined();
  });

  it('keeps tier out of the subtitle, which names the adversary type instead', () => {
    const result = adversaryToEntityCard(buildAdversary({ tier: 2, adversaryType: 'HORDE' }));

    expect(result.subtitle).toBe('Horde');
  });

  it('builds the stats ledger as label/value pairs with the label never baked into the value', () => {
    const result = adversaryToEntityCard(
      buildAdversary({
        difficulty: 14,
        hitPointMax: 8,
        stressMax: 3,
        evasion: 12,
        majorThreshold: 8,
        severeThreshold: 15,
        attackModifier: 3,
      }),
    );

    expect(result.stats).toEqual([
      { label: 'Difficulty', value: '14' },
      { label: 'HP', value: '8' },
      { label: 'Stress', value: '3' },
      { label: 'Evasion', value: '12' },
      { label: 'Major', value: '8' },
      { label: 'Severe', value: '15' },
      { label: 'Atk', value: '+3' },
    ]);
  });

  it('omits stats entries for fields that are not present', () => {
    const result = adversaryToEntityCard(buildAdversary({ hitPointMax: 8 }));

    expect(result.stats).toEqual([{ label: 'HP', value: '8' }]);
  });

  it('leaves stats unset entirely when the adversary has no numeric fields', () => {
    const result = adversaryToEntityCard(buildAdversary());

    expect(result.stats).toBeUndefined();
  });

  it('formats a negative attack modifier without a doubled sign', () => {
    const result = adversaryToEntityCard(buildAdversary({ attackModifier: -2 }));

    expect(result.stats).toEqual([{ label: 'Atk', value: '-2' }]);
  });

  it('assembles the attack line as a meta row, title-casing the range and not duplicating the damage type', () => {
    const result = adversaryToEntityCard(
      buildAdversary({
        weaponName: 'Claws',
        attackRange: 'VERY_CLOSE',
        damage: { notation: '1d12+2 phy', damageType: 'PHYSICAL' },
      }),
    );

    expect(result.meta).toContainEqual({ label: 'Attack', value: 'Claws · Very Close · 1d12+2 phy' });
  });

  it('omits the attack meta row when there is no weapon', () => {
    const result = adversaryToEntityCard(buildAdversary({ experiences: [{ description: 'Thief', modifier: 1 }] }));

    expect(result.meta?.some(row => row.label === 'Attack')).toBe(false);
  });

  it('maps experiences to meta rows with the formatted modifier', () => {
    const result = adversaryToEntityCard(
      buildAdversary({ experiences: [{ description: 'Tremor Sense', modifier: 2 }] }),
    );

    expect(result.meta).toContainEqual({ label: 'Tremor Sense', value: '+2' });
  });

  it('maps motives and tactics to a meta row', () => {
    const result = adversaryToEntityCard(buildAdversary({ motivesAndTactics: 'Burrow, drag away, feed.' }));

    expect(result.meta).toContainEqual({ label: 'Motives & Tactics', value: 'Burrow, drag away, feed.' });
  });

  it('leaves the colon out of meta labels, since the card draws label and value as grid columns', () => {
    const result = adversaryToEntityCard(
      buildAdversary({
        weaponName: 'Claws',
        experiences: [{ description: 'Tremor Sense', modifier: 2 }],
        motivesAndTactics: 'Burrow, drag away, feed.',
      }),
    );

    expect(result.meta?.every(row => !row.label.includes(':'))).toBe(true);
  });

  it('leaves meta unset entirely when there is nothing to show', () => {
    const result = adversaryToEntityCard(buildAdversary());

    expect(result.meta).toBeUndefined();
  });

  it('maps description', () => {
    const result = adversaryToEntityCard(buildAdversary({ description: 'A horse-sized insect.' }));

    expect(result.description).toBe('A horse-sized insect.');
  });

  it('maps features with name, description, and tags', () => {
    const result = adversaryToEntityCard(
      buildAdversary({ features: [{ name: 'Relentless', description: 'Spend Fear to spotlight.', tags: ['Passive'] }] }),
    );

    expect(result.features).toEqual([{ name: 'Relentless', description: 'Spend Fear to spotlight.', tags: ['Passive'] }]);
  });

  it('treats a blank feature name as absent, not an empty string', () => {
    const result = adversaryToEntityCard(buildAdversary({ features: [{ name: '', description: 'Bare paragraph.' }] }));

    expect(result.features![0].name).toBeUndefined();
  });

  it('leaves features unset when there are none', () => {
    const result = adversaryToEntityCard(buildAdversary({ features: [] }));

    expect(result.features).toBeUndefined();
  });

  describe('effectiveTier (the roster retier control)', () => {
    it('leaves everything unchanged when effectiveTier matches the printed tier', () => {
      const withTier = adversaryToEntityCard(buildAdversary({ tier: 1, difficulty: 10 }));
      const withMatchingEffectiveTier = adversaryToEntityCard(buildAdversary({ tier: 1, difficulty: 10 }), 1);

      expect(withMatchingEffectiveTier).toEqual(withTier);
    });

    it('swaps Difficulty/thresholds/attack modifier to the improvised statistics for the new tier', () => {
      const result = adversaryToEntityCard(buildAdversary({ tier: 1, difficulty: 10, attackModifier: 1 }), 3);

      expect(result.headline).toBe('Retiered from Tier 1');
      expect(result.stats).toContainEqual({ label: 'Difficulty', value: '17' });
      expect(result.stats).toContainEqual({ label: 'Atk', value: '+3' });
    });

    it('sets the tier badge to the effective tier, not the printed one', () => {
      const result = adversaryToEntityCard(buildAdversary({ tier: 1 }), 3);

      expect(result.badges?.[0]).toEqual({ label: 'Tier', value: '3' });
    });

    it('adds a "Retiered from Tier N" badge after the tier chip, naming the original printed tier', () => {
      const result = adversaryToEntityCard(buildAdversary({ tier: 1 }), 3);

      expect(result.badges).toEqual([{ label: 'Tier', value: '3' }, { label: 'Retiered from Tier 1' }]);
    });

    it('leaves the tier badge standing alone when effectiveTier is undefined', () => {
      const result = adversaryToEntityCard(buildAdversary({ tier: 1 }));

      expect(result.badges).toEqual([{ label: 'Tier', value: '1' }]);
    });

    it('folds the retiered marker into the headline so it survives EntityCard compact size, which hides badges', () => {
      const result = adversaryToEntityCard(buildAdversary({ tier: 1, difficulty: 10 }), 3);

      expect(result.headline).toContain('Retiered from Tier 1');
    });

    it('sets the headline to the retiered marker alone when there is no difficulty to lead with', () => {
      // effectiveTier 9 is out of the improvised-stats table's 1-4 range, so it falls back to the
      // (here, unset) printed difficulty -- exercising the branch where headlineParts has only
      // the retiered fact.
      const result = adversaryToEntityCard(buildAdversary({ tier: 1, difficulty: undefined }), 9);

      expect(result.headline).toBe('Retiered from Tier 1');
    });

    it('leaves the headline unset when not retiered', () => {
      const result = adversaryToEntityCard(buildAdversary({ tier: 1, difficulty: 10 }));

      expect(result.headline).toBeUndefined();
    });

    it('does not retier the weapon/range/damage attack line, matching AdversaryCard', () => {
      const result = adversaryToEntityCard(
        buildAdversary({
          tier: 1,
          weaponName: 'Claws',
          attackRange: 'MELEE',
          damage: { notation: '1d6+1 phy', damageType: 'PHYSICAL' },
        }),
        3,
      );

      expect(result.meta).toContainEqual({ label: 'Attack', value: 'Claws · Melee · 1d6+1 phy' });
    });
  });
});
