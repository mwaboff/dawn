import { describe, it, expect } from 'vitest';
import { countBonusSlotsFromAdvancements } from './bonus-domain-card.utils';
import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse, SubclassFeatureResponse } from '../../../shared/models/subclass-api.model';

function makeCard(
  id: number,
  features: Partial<SubclassFeatureResponse>[] = [],
): SubclassCardResponse {
  return {
    id,
    name: `Card ${id}`,
    cardType: 'SUBCLASS',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: features.map((f, i) => ({
      id: i + 1,
      name: f.name ?? 'feat',
      description: f.description ?? '',
      featureType: f.featureType ?? 'PASSIVE',
      expansionId: 1,
      costTagIds: [],
      costTags: [],
      modifiers: f.modifiers,
    })),
    costTagIds: [],
    costTags: [],
    subclassPathId: 1,
    level: 'FOUNDATION',
    createdAt: '',
    lastModifiedAt: '',
  };
}

describe('countBonusSlotsFromAdvancements', () => {
  const emptyOwned = new Set<number>();
  const noopLookup = () => undefined;

  it('returns 0 for empty advancements', () => {
    expect(countBonusSlotsFromAdvancements([], emptyOwned, noopLookup)).toBe(0);
  });

  it('returns 0 when no advancements match UPGRADE_SUBCLASS / MULTICLASS', () => {
    const chosen: AdvancementChoice[] = [{ type: 'GAIN_HP' }, { type: 'GAIN_DOMAIN_CARD', domainCardId: 1 }];
    expect(countBonusSlotsFromAdvancements(chosen, emptyOwned, noopLookup)).toBe(0);
  });

  it('returns 0 when matching advancement has no bonus modifier on the card', () => {
    const card = makeCard(10, [{ modifiers: [{ target: 'SOMETHING_ELSE', operation: 'ADD', value: 1 }] }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 10 }];
    expect(countBonusSlotsFromAdvancements(chosen, emptyOwned, (id) => id === 10 ? card : undefined)).toBe(0);
  });

  it('returns modifier value when matching advancement card carries BONUS_DOMAIN_CARD_SELECTIONS', () => {
    const card = makeCard(10, [{ modifiers: [{ target: 'BONUS_DOMAIN_CARD_SELECTIONS', operation: 'ADD', value: 1 }] }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 10 }];
    expect(countBonusSlotsFromAdvancements(chosen, emptyOwned, (id) => id === 10 ? card : undefined)).toBe(1);
  });

  it('sums multiple matching advancements', () => {
    const c1 = makeCard(10, [{ modifiers: [{ target: 'BONUS_DOMAIN_CARD_SELECTIONS', operation: 'ADD', value: 1 }] }]);
    const c2 = makeCard(20, [{ modifiers: [{ target: 'BONUS_DOMAIN_CARD_SELECTIONS', operation: 'ADD', value: 2 }] }]);
    const chosen: AdvancementChoice[] = [
      { type: 'UPGRADE_SUBCLASS', subclassCardId: 10 },
      { type: 'MULTICLASS', subclassCardId: 20 },
    ];
    const lookup = (id: number) => id === 10 ? c1 : id === 20 ? c2 : undefined;
    expect(countBonusSlotsFromAdvancements(chosen, emptyOwned, lookup)).toBe(3);
  });

  it('skips advancements whose subclassCardId is in ownedSubclassIds', () => {
    const card = makeCard(10, [{ modifiers: [{ target: 'BONUS_DOMAIN_CARD_SELECTIONS', operation: 'ADD', value: 1 }] }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 10 }];
    expect(countBonusSlotsFromAdvancements(chosen, new Set([10]), (id) => id === 10 ? card : undefined)).toBe(0);
  });

  it('skips advancements missing subclassCardId', () => {
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS' }];
    expect(countBonusSlotsFromAdvancements(chosen, emptyOwned, noopLookup)).toBe(0);
  });

  it('returns 0 when lookup returns undefined', () => {
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 99 }];
    expect(countBonusSlotsFromAdvancements(chosen, emptyOwned, () => undefined)).toBe(0);
  });
});
