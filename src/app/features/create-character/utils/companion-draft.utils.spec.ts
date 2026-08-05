import { describe, it, expect } from 'vitest';
import { isCompanionDraftReady } from './companion-draft.utils';
import { CompanionDraft } from '../models/companion-draft.model';
import { Experience } from '../../../shared/models/experience.model';

const TWO_NAMED_EXPERIENCES: Experience[] = [
  { name: 'Tracker', modifier: 2 },
  { name: 'Loyal Guardian', modifier: 2 },
];

function buildDraft(
  payloadOverrides: Partial<CompanionDraft['payload']> = {},
  experiences: Experience[] = TWO_NAMED_EXPERIENCES,
): CompanionDraft {
  return {
    payload: {
      name: 'Rufus',
      description: undefined,
      evasion: 10,
      attackName: 'Bite',
      attackRange: 'MELEE',
      damageDice: 'D6',
      stressMax: 3,
      ...payloadOverrides,
    },
    experiences,
  };
}

describe('isCompanionDraftReady', () => {
  it('returns false for null', () => {
    expect(isCompanionDraftReady(null)).toBe(false);
  });

  it('returns true when name, attackName, and both Experience names are filled in', () => {
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

  it('returns false when there are no Experiences at all', () => {
    expect(isCompanionDraftReady(buildDraft({}, []))).toBe(false);
  });

  it('returns false when only one Experience is named', () => {
    expect(isCompanionDraftReady(buildDraft({}, [{ name: 'Tracker', modifier: 2 }, { name: '', modifier: 2 }]))).toBe(false);
  });

  it('returns false when both Experience names are blank', () => {
    expect(isCompanionDraftReady(buildDraft({}, [{ name: '', modifier: 2 }, { name: '', modifier: 2 }]))).toBe(false);
  });

  it('returns true when both Experiences are named, regardless of modifier value', () => {
    // Readiness only cares that the two starting Experiences are named -- CompanionCreator is
    // what guarantees the modifier is always +2; this check must not accidentally re-validate it.
    expect(isCompanionDraftReady(buildDraft({}, [{ name: 'Tracker', modifier: 2 }, { name: 'Loyal', modifier: 2 }]))).toBe(true);
  });
});
