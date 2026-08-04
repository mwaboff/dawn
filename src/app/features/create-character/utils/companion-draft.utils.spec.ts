import { describe, it, expect } from 'vitest';
import { isCompanionDraftReady } from './companion-draft.utils';
import { CompanionDraft } from '../models/companion-draft.model';

function buildDraft(overrides: Partial<CompanionDraft['payload']> = {}): CompanionDraft {
  return {
    payload: {
      name: 'Rufus',
      description: undefined,
      evasion: 10,
      attackName: 'Bite',
      attackRange: 'MELEE',
      damageDice: 'D6',
      stressMax: 3,
      ...overrides,
    },
    experiences: [],
  };
}

describe('isCompanionDraftReady', () => {
  it('returns false for null', () => {
    expect(isCompanionDraftReady(null)).toBe(false);
  });

  it('returns true when both name and attackName are filled in', () => {
    expect(isCompanionDraftReady(buildDraft())).toBe(true);
  });

  it('returns false when name is blank', () => {
    expect(isCompanionDraftReady(buildDraft({ name: '' }))).toBe(false);
  });

  it('returns false when attackName is blank', () => {
    expect(isCompanionDraftReady(buildDraft({ attackName: '' }))).toBe(false);
  });

  it('returns false when name is only whitespace', () => {
    expect(isCompanionDraftReady(buildDraft({ name: '   ' }))).toBe(false);
  });
});
