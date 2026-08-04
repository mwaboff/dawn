import { describe, it, expect } from 'vitest';
import { companionTrainingBonusPicks } from './companion-training-bonus.utils';
import { AdvancementChoice } from '../models/level-up-api.model';
import { SubclassCardResponse, SubclassFeatureResponse, SubclassLevel } from '../../../shared/models/subclass-api.model';

function makeCard(
  id: number,
  level: SubclassLevel,
  features: Partial<SubclassFeatureResponse>[],
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
    })),
    costTagIds: [],
    costTags: [],
    subclassPathId: 1,
    level,
    createdAt: '',
    lastModifiedAt: '',
  };
}

// Verified production data: Beastbound FOUNDATION carries "Companion"; SPECIALIZATION carries
// "Expert Training" + "Battle-Bonded"; MASTERY carries "Advanced Training" + "Loyal Friend" --
// all featureType 'SUBCLASS'.
function makeFoundationCard(id: number): SubclassCardResponse {
  return makeCard(id, 'FOUNDATION', [{ name: 'Companion', featureType: 'SUBCLASS' }]);
}

function makeSpecializationCard(id: number): SubclassCardResponse {
  return makeCard(id, 'SPECIALIZATION', [
    { name: 'Expert Training', featureType: 'SUBCLASS' },
    { name: 'Battle-Bonded', featureType: 'SUBCLASS' },
  ]);
}

function makeMasteryCard(id: number): SubclassCardResponse {
  return makeCard(id, 'MASTERY', [
    { name: 'Advanced Training', featureType: 'SUBCLASS' },
    { name: 'Loyal Friend', featureType: 'SUBCLASS' },
  ]);
}

describe('companionTrainingBonusPicks', () => {
  const emptyOwned = new Set<number>();

  it('returns 0 for empty advancements', () => {
    expect(companionTrainingBonusPicks([], emptyOwned, () => undefined)).toBe(0);
  });

  it('returns 0 for the Foundation card (grants "Companion", not a Training bonus)', () => {
    const card = makeFoundationCard(500);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(companionTrainingBonusPicks(chosen, emptyOwned, (id) => id === 500 ? card : undefined)).toBe(0);
  });

  it('returns +1 when the Specialization card ("Expert Training") is taken this level-up', () => {
    const card = makeSpecializationCard(500);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 500 }];
    expect(companionTrainingBonusPicks(chosen, emptyOwned, (id) => id === 500 ? card : undefined)).toBe(1);
  });

  it('returns +2 when the Mastery card ("Advanced Training") is taken this level-up', () => {
    const card = makeMasteryCard(500);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 500 }];
    expect(companionTrainingBonusPicks(chosen, emptyOwned, (id) => id === 500 ? card : undefined)).toBe(2);
  });

  it('matches the feature name case/whitespace-insensitively (homebrew support)', () => {
    const card = makeCard(500, 'SPECIALIZATION', [{ name: '  EXPERT training  ', featureType: 'SUBCLASS' }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 500 }];
    expect(companionTrainingBonusPicks(chosen, emptyOwned, (id) => id === 500 ? card : undefined)).toBe(1);
  });

  it('does not match a same-named feature of a different featureType', () => {
    const card = makeCard(500, 'SPECIALIZATION', [{ name: 'Expert Training', featureType: 'PASSIVE' }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 500 }];
    expect(companionTrainingBonusPicks(chosen, emptyOwned, (id) => id === 500 ? card : undefined)).toBe(0);
  });

  it('ignores an already-owned subclass card id (defense-in-depth)', () => {
    const card = makeMasteryCard(500);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 500 }];
    expect(companionTrainingBonusPicks(chosen, new Set([500]), (id) => id === 500 ? card : undefined)).toBe(0);
  });

  it('sums bonuses across multiple qualifying advancements', () => {
    const spec = makeSpecializationCard(500);
    const mastery = makeMasteryCard(600);
    const chosen: AdvancementChoice[] = [
      { type: 'UPGRADE_SUBCLASS', subclassCardId: 500 },
      { type: 'UPGRADE_SUBCLASS', subclassCardId: 600 },
    ];
    const lookup = (id: number) => (id === 500 ? spec : id === 600 ? mastery : undefined);
    expect(companionTrainingBonusPicks(chosen, emptyOwned, lookup)).toBe(3);
  });
});
