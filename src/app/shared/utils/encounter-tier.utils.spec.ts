import { tierRangeLabel } from './encounter-tier.utils';
import { EncounterResponse } from '../models/encounter-api.model';

function buildEncounterResponse(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 1,
    name: 'Goblin Ambush',
    isOfficial: false,
    isPublic: false,
    creatorId: 1,
    adversaries: [],
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: 14,
    spentBattlePoints: 6,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('tierRangeLabel', () => {
  it('should return "Tier N" when the encounter has an overall tier, regardless of adversaries', () => {
    expect(tierRangeLabel(buildEncounterResponse({ tier: 2, adversaries: [] }))).toBe('Tier 2');
  });

  it('should return "Mixed Tier" for an encounter with no adversaries and no overall tier', () => {
    expect(tierRangeLabel(buildEncounterResponse({ tier: undefined, adversaries: [] }))).toBe('Mixed Tier');
  });

  it('should return a single tier label when every adversary instance shares a tier', () => {
    const encounter = buildEncounterResponse({
      adversaries: [{ id: 1, adversaryId: 5, adversary: { id: 5, name: 'A', tier: 2, adversaryType: 'MINION' }, displayOrder: 0 }],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 2');
  });

  it('should return a range when instances span multiple tiers', () => {
    const encounter = buildEncounterResponse({
      adversaries: [
        { id: 1, adversaryId: 5, adversary: { id: 5, name: 'A', tier: 1, adversaryType: 'MINION' }, displayOrder: 0 },
        { id: 2, adversaryId: 6, adversary: { id: 6, name: 'B', tier: 3, adversaryType: 'SOLO' }, displayOrder: 1 },
      ],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 1–3');
  });

  it('should prefer tierOverride over the printed tier', () => {
    const encounter = buildEncounterResponse({
      adversaries: [{ id: 1, adversaryId: 5, adversary: { id: 5, name: 'A', tier: 1, adversaryType: 'MINION' }, tierOverride: 4, displayOrder: 0 }],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 4');
  });

  // getOwnEncounters doesn't request ?expand=adversaryDetails, so entry.adversary is never
  // populated for these -- the server's own rolled-up `tier` field covers the common,
  // single-tier case without needing it at all.
  it('should prefer the server\'s own overall tier, without needing expanded adversary data', () => {
    const encounter = buildEncounterResponse({
      tier: 2,
      adversaries: [{ id: 1, adversaryId: 5, displayOrder: 0 }],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 2');
  });

  // `tier` is null for a deliberately multi-tier encounter -- this encounter plainly has
  // adversaries, but none of them carry a resolvable tier without expansion.
  it('should fall back to "Mixed Tier" for a multi-tier encounter with no resolvable adversary tiers', () => {
    const encounter = buildEncounterResponse({
      tier: undefined,
      adversaries: [{ id: 1, adversaryId: 5, displayOrder: 0 }, { id: 2, adversaryId: 6, displayOrder: 1 }],
    });
    expect(tierRangeLabel(encounter)).toBe('Mixed Tier');
  });
});
