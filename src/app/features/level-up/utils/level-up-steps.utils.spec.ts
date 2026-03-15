import { describe, it, expect } from 'vitest';
import { computeVisibleTabs } from './level-up-steps.utils';
import { LevelUpOptionsResponse } from '../models/level-up-api.model';

function makeOptions(overrides: Partial<LevelUpOptionsResponse> = {}): LevelUpOptionsResponse {
  return {
    currentLevel: 4,
    nextLevel: 5,
    currentTier: 2,
    nextTier: 3,
    isTierTransition: false,
    availableAdvancements: [],
    domainCardLevelCap: 7,
    accessibleDomainIds: [1, 3],
    equippedDomainCardCount: 4,
    maxEquippedDomainCards: 5,
    ...overrides,
  };
}

describe('computeVisibleTabs', () => {
  it('includes tier-achievements tab for tier transitions', () => {
    const tabs = computeVisibleTabs(makeOptions({ isTierTransition: true }));
    expect(tabs.map(t => t.id)).toContain('tier-achievements');
    expect(tabs).toHaveLength(5);
  });

  it('excludes tier-achievements tab for non-tier transitions', () => {
    const tabs = computeVisibleTabs(makeOptions({ isTierTransition: false, currentTier: 2, nextTier: 2 }));
    expect(tabs.map(t => t.id)).not.toContain('tier-achievements');
    expect(tabs).toHaveLength(4);
  });

  it('always includes advancements, domain-card, domain-trades, review', () => {
    const tabs = computeVisibleTabs(makeOptions({ isTierTransition: false, currentTier: 2, nextTier: 2 }));
    const ids = tabs.map(t => t.id);
    expect(ids).toContain('advancements');
    expect(ids).toContain('domain-card');
    expect(ids).toContain('domain-trades');
    expect(ids).toContain('review');
  });

  it('returns tabs in correct order for tier transition', () => {
    const tabs = computeVisibleTabs(makeOptions({ isTierTransition: true }));
    const ids = tabs.map(t => t.id);
    expect(ids).toEqual(['tier-achievements', 'advancements', 'domain-card', 'domain-trades', 'review']);
  });

  it('returns tabs in correct order for non-tier transition', () => {
    const tabs = computeVisibleTabs(makeOptions({ isTierTransition: false, currentTier: 2, nextTier: 2 }));
    const ids = tabs.map(t => t.id);
    expect(ids).toEqual(['advancements', 'domain-card', 'domain-trades', 'review']);
  });

  it('includes tier-achievements tab when currentTier differs from nextTier even if isTierTransition is false', () => {
    const tabs = computeVisibleTabs(makeOptions({ isTierTransition: false, currentTier: 1, nextTier: 2 }));
    expect(tabs.map(t => t.id)).toContain('tier-achievements');
    expect(tabs).toHaveLength(5);
  });
});
