import {
  buildEncounterPayload,
  fromApiAdjustments,
  mapResponseToRosterInstances,
  toApiAdjustments,
} from './encounter-builder.mapper';
import { EncounterResponse } from '../../../shared/models/encounter-api.model';
import { AdversaryApiResponse } from '../../../shared/models/adversary-api.model';
import { EncounterRosterInstance } from './models/encounter-roster-instance.model';

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
    spentBattlePoints: 0,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildAdversaryApiResponse(overrides: Partial<AdversaryApiResponse> = {}): AdversaryApiResponse {
  return { id: 5, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION', ...overrides };
}

describe('toApiAdjustments', () => {
  it('maps every short-form key to its adjustmentX field', () => {
    expect(toApiAdjustments({ easier: true, twoPlusSolos: true, bonusDamage: true, lowerTier: true, noElites: true, harder: true })).toEqual({
      adjustmentEasier: true,
      adjustmentTwoPlusSolos: true,
      adjustmentBonusDamage: true,
      adjustmentLowerTier: true,
      adjustmentNoElites: true,
      adjustmentHarder: true,
    });
  });
});

describe('fromApiAdjustments', () => {
  it('maps every adjustmentX field back to its short-form key', () => {
    const response = buildEncounterResponse({
      adjustmentEasier: true,
      adjustmentHarder: true,
    });
    expect(fromApiAdjustments(response)).toEqual({
      easier: true,
      twoPlusSolos: false,
      bonusDamage: false,
      lowerTier: false,
      noElites: false,
      harder: true,
    });
  });
});

describe('buildEncounterPayload', () => {
  it('trims the name and omits an empty description', () => {
    const payload = buildEncounterPayload({
      name: '  Goblin Ambush  ',
      description: '   ',
      partySize: 4,
      adjustments: {},
      environmentId: undefined,
      roster: [],
    });
    expect(payload.name).toBe('Goblin Ambush');
    expect(payload.description).toBeUndefined();
  });

  it('maps roster instances to adversary entries', () => {
    const roster: EncounterRosterInstance[] = [
      { localId: 'a', adversaryId: 5, adversary: { id: 5, name: 'Goblin', tier: 1, adversaryType: 'MINION' }, label: 'Archer A', tierOverride: 3, displayOrder: 0 },
    ];
    const payload = buildEncounterPayload({
      name: 'Goblin Ambush',
      description: '',
      partySize: 4,
      adjustments: {},
      environmentId: 9,
      roster,
    });
    expect(payload.adversaries).toEqual([{ adversaryId: 5, label: 'Archer A', tierOverride: 3 }]);
    expect(payload.environmentId).toBe(9);
  });
});

describe('mapResponseToRosterInstances', () => {
  it('maps expanded adversary details straight from the response', () => {
    const response = buildEncounterResponse({
      adversaries: [{ id: 10, adversaryId: 5, adversary: buildAdversaryApiResponse(), displayOrder: 0 }],
    });
    const roster = mapResponseToRosterInstances(response);
    expect(roster).toHaveLength(1);
    expect(roster[0].localId).toBe('10');
    expect(roster[0].adversary.name).toBe('Goblin Scout');
  });

  it('sorts by displayOrder', () => {
    const response = buildEncounterResponse({
      adversaries: [
        { id: 1, adversaryId: 5, adversary: buildAdversaryApiResponse({ name: 'Second' }), displayOrder: 1 },
        { id: 2, adversaryId: 6, adversary: buildAdversaryApiResponse({ name: 'First' }), displayOrder: 0 },
      ],
    });
    const roster = mapResponseToRosterInstances(response);
    expect(roster.map(r => r.adversary.name)).toEqual(['First', 'Second']);
  });

  it('backfills missing adversary details from previousRoster by position', () => {
    const response = buildEncounterResponse({
      adversaries: [{ id: 10, adversaryId: 5, displayOrder: 0 }],
    });
    const previousRoster: EncounterRosterInstance[] = [
      { localId: 'new-1', adversaryId: 5, adversary: { id: 5, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' }, displayOrder: 0 },
    ];
    const roster = mapResponseToRosterInstances(response, previousRoster);
    expect(roster[0].adversary.name).toBe('Goblin Scout');
    expect(roster[0].localId).toBe('10');
  });

  it('drops an instance neither the response nor previousRoster can supply adversary data for', () => {
    const response = buildEncounterResponse({ adversaries: [{ id: 10, adversaryId: 5, displayOrder: 0 }] });
    expect(mapResponseToRosterInstances(response)).toEqual([]);
  });
});
