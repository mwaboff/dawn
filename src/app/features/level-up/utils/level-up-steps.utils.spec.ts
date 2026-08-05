import { describe, it, expect } from 'vitest';
import { computeVisibleTabs } from './level-up-steps.utils';
import { LevelUpOptionsResponse } from '../models/level-up-api.model';

function makeOptions(overrides: Partial<LevelUpOptionsResponse> = {}): LevelUpOptionsResponse {
  return {
    currentLevel: 4,
    nextLevel: 5,
    currentTier: 2,
    nextTier: 3,
    tierTransition: false,
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
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: true }));
    expect(tabs.map(t => t.id)).toContain('tier-achievements');
    expect(tabs).toHaveLength(5);
  });

  it('excludes tier-achievements tab for non-tier transitions', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 2, nextTier: 2 }));
    expect(tabs.map(t => t.id)).not.toContain('tier-achievements');
    expect(tabs).toHaveLength(4);
  });

  it('always includes advancements, domain-card, domain-trades, review', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 2, nextTier: 2 }));
    const ids = tabs.map(t => t.id);
    expect(ids).toContain('advancements');
    expect(ids).toContain('domain-card');
    expect(ids).toContain('domain-trades');
    expect(ids).toContain('review');
  });

  it('returns tabs in correct order for tier transition', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: true }));
    const ids = tabs.map(t => t.id);
    expect(ids).toEqual(['tier-achievements', 'advancements', 'domain-card', 'domain-trades', 'review']);
  });

  it('returns tabs in correct order for non-tier transition', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 2, nextTier: 2 }));
    const ids = tabs.map(t => t.id);
    expect(ids).toEqual(['advancements', 'domain-card', 'domain-trades', 'review']);
  });

  it('includes tier-achievements tab when currentTier differs from nextTier even if tierTransition is false', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 1, nextTier: 2 }));
    expect(tabs.map(t => t.id)).toContain('tier-achievements');
    expect(tabs).toHaveLength(5);
  });

  it('excludes martial-stance tab by default', () => {
    const tabs = computeVisibleTabs(makeOptions());
    expect(tabs.map(t => t.id)).not.toContain('martial-stance');
  });

  it('includes martial-stance tab when hasMartialStances is true', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 2, nextTier: 2 }), { hasMartialStances: true });
    expect(tabs.map(t => t.id)).toContain('martial-stance');
    expect(tabs).toHaveLength(5);
  });

  it('places martial-stance between advancements and domain-card', () => {
    const tabs = computeVisibleTabs(makeOptions({ tierTransition: true }), { hasMartialStances: true });
    const ids = tabs.map(t => t.id);
    expect(ids).toEqual(['tier-achievements', 'advancements', 'martial-stance', 'domain-card', 'domain-trades', 'review']);
  });

  describe('companion tab', () => {
    it('excludes the companion tab by default', () => {
      const tabs = computeVisibleTabs(makeOptions());
      expect(tabs.map(t => t.id)).not.toContain('companion');
    });

    it('includes the companion tab when needsCompanionStep is true, right after advancements', () => {
      const tabs = computeVisibleTabs(makeOptions({ tierTransition: true }), { needsCompanionStep: true });
      const ids = tabs.map(t => t.id);
      expect(ids).toEqual(['tier-achievements', 'advancements', 'companion', 'domain-card', 'domain-trades', 'review']);
    });

    it('places companion before martial-stance when both are shown', () => {
      const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 2, nextTier: 2 }), { needsCompanionStep: true, hasMartialStances: true });
      const ids = tabs.map(t => t.id);
      expect(ids).toEqual(['advancements', 'companion', 'martial-stance', 'domain-card', 'domain-trades', 'review']);
    });
  });

  describe('training tabs', () => {
    it('adds no training tabs when trainingCompanions is empty', () => {
      const tabs = computeVisibleTabs(makeOptions());
      expect(tabs.some(t => t.kind === 'training')).toBe(false);
    });

    it('adds one training tab per eligible companion, right after where martial-stance sits', () => {
      const tabs = computeVisibleTabs(makeOptions({ tierTransition: false, currentTier: 2, nextTier: 2 }), {
        trainingCompanions: [{ companionId: 7, name: 'Rufus' }, { companionId: 9, name: 'Whiskers' }],
      });
      const ids = tabs.map(t => t.id);
      expect(ids).toEqual(['advancements', 'training-7', 'training-9', 'domain-card', 'domain-trades', 'review']);
    });

    it('still inserts training tabs even when martial-stance itself is hidden', () => {
      const tabs = computeVisibleTabs(makeOptions(), {
        hasMartialStances: false,
        trainingCompanions: [{ companionId: 7, name: 'Rufus' }],
      });
      expect(tabs.map(t => t.id)).not.toContain('martial-stance');
      expect(tabs.map(t => t.id)).toContain('training-7');
    });

    it('sets companionId and a per-companion label on training tabs', () => {
      const tabs = computeVisibleTabs(makeOptions(), {
        trainingCompanions: [{ companionId: 7, name: 'Rufus' }],
      });
      const training = tabs.find(t => t.id === 'training-7');
      expect(training?.companionId).toBe(7);
      expect(training?.label).toContain('Rufus');
      expect(training?.kind).toBe('training');
    });

    it('orders training tabs after martial-stance and after companion, all after advancements', () => {
      const tabs = computeVisibleTabs(makeOptions({ tierTransition: true }), {
        needsCompanionStep: true,
        hasMartialStances: true,
        trainingCompanions: [{ companionId: 7, name: 'Rufus' }],
      });
      const ids = tabs.map(t => t.id);
      expect(ids).toEqual([
        'tier-achievements', 'advancements', 'companion', 'martial-stance', 'training-7',
        'domain-card', 'domain-trades', 'review',
      ]);
    });
  });
});
