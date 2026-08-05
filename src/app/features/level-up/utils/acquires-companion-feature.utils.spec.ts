import { describe, it, expect } from 'vitest';
import { acquiresCompanionFeature } from './acquires-companion-feature.utils';
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

describe('acquiresCompanionFeature', () => {
  const emptyOwned = new Set<number>();
  const noopLookup = () => undefined;

  it('returns false for empty advancements', () => {
    expect(acquiresCompanionFeature([], emptyOwned, noopLookup, false)).toBe(false);
  });

  it('detects acquisition for a MULTICLASS advancement granting the Beastbound Companion foundation card', () => {
    const card = makeCard(500, [{ name: 'Companion', featureType: 'SUBCLASS' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresCompanionFeature(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(true);
  });

  it('is not detected by name alone -- the unrelated Beastform "Companion" feature does not count', () => {
    const card = makeCard(500, [{ name: 'Companion', featureType: 'BEASTFORM' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresCompanionFeature(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(false);
  });

  it('is not detected when the character already had the subclass card', () => {
    const card = makeCard(100, [{ name: 'Companion', featureType: 'SUBCLASS' }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 100 }];
    expect(acquiresCompanionFeature(chosen, new Set([100]), (id) => id === 100 ? card : undefined, false)).toBe(false);
  });

  it('is not an acquisition when the character already has the Companion feature', () => {
    const card = makeCard(500, [{ name: 'Companion', featureType: 'SUBCLASS' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresCompanionFeature(chosen, emptyOwned, (id) => id === 500 ? card : undefined, true)).toBe(false);
  });

  it('skips advancements missing subclassCardId', () => {
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS' }];
    expect(acquiresCompanionFeature(chosen, emptyOwned, noopLookup, false)).toBe(false);
  });
});
