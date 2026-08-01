import { describe, it, expect } from 'vitest';
import { acquiresMartialStances } from './acquires-martial-stances.utils';
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

describe('acquiresMartialStances', () => {
  const emptyOwned = new Set<number>();
  const noopLookup = () => undefined;

  it('returns false for empty advancements', () => {
    expect(acquiresMartialStances([], emptyOwned, noopLookup, false)).toBe(false);
  });

  it('returns false when no advancements match UPGRADE_SUBCLASS / MULTICLASS', () => {
    const chosen: AdvancementChoice[] = [{ type: 'GAIN_HP' }, { type: 'GAIN_DOMAIN_CARD', domainCardId: 1 }];
    expect(acquiresMartialStances(chosen, emptyOwned, noopLookup, false)).toBe(false);
  });

  it('detects acquisition for a MULTICLASS advancement granting a Martial Artist foundation card', () => {
    const card = makeCard(500, [{ name: 'Stance Fighter' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresMartialStances(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(true);
  });

  it('detects acquisition for an UPGRADE_SUBCLASS advancement granting Stance Fighter', () => {
    const card = makeCard(500, [{ name: 'Stance Fighter' }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 500 }];
    expect(acquiresMartialStances(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(true);
  });

  it('matches the feature name case/whitespace-insensitively (homebrew support)', () => {
    const card = makeCard(500, [{ name: '  STANCE fighter  ' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresMartialStances(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(true);
  });

  it('is not detected when the card has no Stance Fighter feature (unrelated subclass)', () => {
    const card = makeCard(500, [{ name: 'Some Other Feature' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresMartialStances(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(false);
  });

  it('is not detected when the character already had the subclass card (already had Stance Fighter)', () => {
    const card = makeCard(100, [{ name: 'Stance Fighter' }]);
    const chosen: AdvancementChoice[] = [{ type: 'UPGRADE_SUBCLASS', subclassCardId: 100 }];
    expect(acquiresMartialStances(chosen, new Set([100]), (id) => id === 100 ? card : undefined, false)).toBe(false);
  });

  it('is not detected by subclass name -- only by feature name', () => {
    const card: SubclassCardResponse = { ...makeCard(500, [{ name: 'Not Stance Fighter' }]), name: 'Martial Artist' };
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    expect(acquiresMartialStances(chosen, emptyOwned, (id) => id === 500 ? card : undefined, false)).toBe(false);
  });

  it('skips advancements missing subclassCardId', () => {
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS' }];
    expect(acquiresMartialStances(chosen, emptyOwned, noopLookup, false)).toBe(false);
  });

  it('returns false when lookup returns undefined', () => {
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 999 }];
    expect(acquiresMartialStances(chosen, emptyOwned, () => undefined, false)).toBe(false);
  });
  it('is not an acquisition when the character already has Stance Fighter', () => {
    const card = makeCard(500, [{ name: 'Stance Fighter' }]);
    const chosen: AdvancementChoice[] = [{ type: 'MULTICLASS', subclassCardId: 500 }];
    // A second card carrying the same feature is still not a fresh acquisition: the "choose two
    // from Tier 1" grant fires once per character, not once per card.
    expect(acquiresMartialStances(chosen, emptyOwned, (id) => id === 500 ? card : undefined, true)).toBe(false);
  });
});
