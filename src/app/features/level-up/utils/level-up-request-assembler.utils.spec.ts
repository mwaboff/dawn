import { describe, it, expect } from 'vitest';
import { assembleLevelUpRequest, LevelUpWizardState } from './level-up-request-assembler.utils';

function makeState(overrides: Partial<LevelUpWizardState> = {}): LevelUpWizardState {
  return {
    advancements: [{ type: 'GAIN_HP' }, { type: 'GAIN_STRESS' }],
    newDomainCardId: 15,
    equipNewDomainCard: false,
    trades: [],
    bonusDomainCardIds: [],
    ...overrides,
  };
}

describe('assembleLevelUpRequest', () => {
  it('assembles a minimal request with advancements and domain card', () => {
    const result = assembleLevelUpRequest(makeState());
    expect(result.advancements).toEqual([{ type: 'GAIN_HP' }, { type: 'GAIN_STRESS' }]);
    expect(result.newDomainCardId).toBe(15);
    expect(result.newExperienceDescription).toBeUndefined();
    expect(result.equipNewDomainCard).toBeUndefined();
    expect(result.unequipDomainCardId).toBeUndefined();
    expect(result.trades).toBeUndefined();
  });

  it('includes newExperienceDescription when provided', () => {
    const result = assembleLevelUpRequest(makeState({
      newExperienceDescription: 'Defeated the Shadow King',
    }));
    expect(result.newExperienceDescription).toBe('Defeated the Shadow King');
  });

  it('includes equipNewDomainCard when true', () => {
    const result = assembleLevelUpRequest(makeState({ equipNewDomainCard: true }));
    expect(result.equipNewDomainCard).toBe(true);
  });

  it('omits equipNewDomainCard when false', () => {
    const result = assembleLevelUpRequest(makeState({ equipNewDomainCard: false }));
    expect(result.equipNewDomainCard).toBeUndefined();
  });

  it('includes unequipDomainCardId when provided', () => {
    const result = assembleLevelUpRequest(makeState({ unequipDomainCardId: 8 }));
    expect(result.unequipDomainCardId).toBe(8);
  });

  it('includes trades when non-empty', () => {
    const trades = [{ tradeOutCardIds: [3], tradeInCardIds: [12], equipTradedInCardIds: [] }];
    const result = assembleLevelUpRequest(makeState({ trades }));
    expect(result.trades).toEqual(trades);
  });

  it('omits trades when empty', () => {
    const result = assembleLevelUpRequest(makeState({ trades: [] }));
    expect(result.trades).toBeUndefined();
  });

  it('includes BOOST_TRAITS advancement with trait selections', () => {
    const result = assembleLevelUpRequest(makeState({
      advancements: [
        { type: 'BOOST_TRAITS', traits: ['AGILITY', 'STRENGTH'] },
        { type: 'GAIN_HP' },
      ],
    }));
    expect(result.advancements[0].traits).toEqual(['AGILITY', 'STRENGTH']);
  });

  it('includes BOOST_EXPERIENCES advancement with experience IDs', () => {
    const result = assembleLevelUpRequest(makeState({
      advancements: [
        { type: 'BOOST_EXPERIENCES', experienceIds: [1, 2] },
        { type: 'GAIN_HP' },
      ],
    }));
    expect(result.advancements[0].experienceIds).toEqual([1, 2]);
  });

  it('assembles a full tier-transition request', () => {
    const result = assembleLevelUpRequest(makeState({
      newExperienceDescription: 'Survived the Wastes',
      advancements: [
        { type: 'BOOST_TRAITS', traits: ['AGILITY', 'STRENGTH'] },
        { type: 'GAIN_DOMAIN_CARD', domainCardId: 20, equipDomainCard: true },
      ],
      equipNewDomainCard: true,
      unequipDomainCardId: 5,
      trades: [{ tradeOutCardIds: [3], tradeInCardIds: [12], equipTradedInCardIds: [12] }],
    }));

    expect(result.newExperienceDescription).toBe('Survived the Wastes');
    expect(result.advancements).toHaveLength(2);
    expect(result.equipNewDomainCard).toBe(true);
    expect(result.unequipDomainCardId).toBe(5);
    expect(result.trades).toHaveLength(1);
  });

  describe('bonus domain card entries (FEATURE_DOMAIN_CARD)', () => {
    it('appends no FEATURE_DOMAIN_CARD entries when bonusDomainCardIds is empty', () => {
      const result = assembleLevelUpRequest(makeState({ bonusDomainCardIds: [] }));
      expect(result.advancements.filter(a => a.type === 'FEATURE_DOMAIN_CARD')).toHaveLength(0);
    });

    it('appends one FEATURE_DOMAIN_CARD entry with correct domainCardId and no equipDomainCard', () => {
      const result = assembleLevelUpRequest(makeState({ bonusDomainCardIds: [42] }));
      const bonus = result.advancements.filter(a => a.type === 'FEATURE_DOMAIN_CARD');
      expect(bonus).toHaveLength(1);
      expect(bonus[0]).toEqual({ type: 'FEATURE_DOMAIN_CARD', domainCardId: 42 });
      expect(bonus[0].equipDomainCard).toBeUndefined();
    });

    it('appends two FEATURE_DOMAIN_CARD entries with correct IDs', () => {
      const result = assembleLevelUpRequest(makeState({ bonusDomainCardIds: [42, 77] }));
      const bonus = result.advancements.filter(a => a.type === 'FEATURE_DOMAIN_CARD');
      expect(bonus).toHaveLength(2);
      expect(bonus.map(b => b.domainCardId)).toEqual([42, 77]);
    });

    it('places bonus entries after player-chosen advancements', () => {
      const result = assembleLevelUpRequest(makeState({
        advancements: [{ type: 'GAIN_HP' }, { type: 'UPGRADE_SUBCLASS', subclassCardId: 9 }],
        bonusDomainCardIds: [42],
      }));
      expect(result.advancements.map(a => a.type)).toEqual([
        'GAIN_HP',
        'UPGRADE_SUBCLASS',
        'FEATURE_DOMAIN_CARD',
      ]);
    });

    it('coexists with GAIN_DOMAIN_CARD: player entries retained, bonus appended after', () => {
      const result = assembleLevelUpRequest(makeState({
        advancements: [
          { type: 'GAIN_DOMAIN_CARD', domainCardId: 50, equipDomainCard: true },
          { type: 'UPGRADE_SUBCLASS', subclassCardId: 9 },
        ],
        bonusDomainCardIds: [60],
      }));
      expect(result.advancements).toHaveLength(3);
      expect(result.advancements[0]).toEqual({ type: 'GAIN_DOMAIN_CARD', domainCardId: 50, equipDomainCard: true });
      expect(result.advancements[2]).toEqual({ type: 'FEATURE_DOMAIN_CARD', domainCardId: 60 });
    });
  });
});
