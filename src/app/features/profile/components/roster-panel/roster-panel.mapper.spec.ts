import { campaignToRosterItem, encounterToRosterItem } from './roster-panel.mapper';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { EncounterResponse } from '../../../../shared/models/encounter-api.model';

function makeCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Dragon Slayers',
    fear: 0,
    isEnded: false,
    creatorId: 10,
    gameMasterIds: [10],
    playerIds: [1, 2, 3],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    createdAt: '2025-06-15T10:30:00',
    lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

function makeEncounter(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 1,
    name: 'Goblin Ambush',
    isOfficial: false,
    isPublic: false,
    creatorId: 10,
    adversaries: [],
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: 10,
    spentBattlePoints: 5,
    createdAt: '2025-01-01T00:00:00',
    lastModifiedAt: '2025-01-01T00:00:00',
    ...overrides,
  };
}

describe('campaignToRosterItem', () => {
  it('should map id and name through', () => {
    const item = campaignToRosterItem(makeCampaign({ id: 7, name: 'The Lost Mines' }));
    expect(item.id).toBe(7);
    expect(item.name).toBe('The Lost Mines');
  });

  it('should format metaPrimary as "GM: {username}"', () => {
    const item = campaignToRosterItem(makeCampaign({
      creator: { id: 10, username: 'dungeon_master', email: 'dm@test.com', role: 'USER', createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00', usernameChosen: true },
    }));
    expect(item.metaPrimary).toBe('GM: dungeon_master');
  });

  it('should fall back to "Unknown" GM when creator is not expanded', () => {
    const item = campaignToRosterItem(makeCampaign({ creator: undefined }));
    expect(item.metaPrimary).toBe('GM: Unknown');
  });

  it('should format metaSecondary as player count', () => {
    const item = campaignToRosterItem(makeCampaign({ playerIds: [1, 2, 3, 4] }));
    expect(item.metaSecondary).toBe('4 players');
  });

  it('should set badge to "Ended" for ended campaigns', () => {
    const item = campaignToRosterItem(makeCampaign({ isEnded: true }));
    expect(item.badge).toBe('Ended');
  });

  it('should leave badge undefined for active campaigns', () => {
    const item = campaignToRosterItem(makeCampaign({ isEnded: false }));
    expect(item.badge).toBeUndefined();
  });
});

describe('encounterToRosterItem', () => {
  it('should map id and name through', () => {
    const item = encounterToRosterItem(makeEncounter({ id: 9, name: 'The Sunken Crypt' }));
    expect(item.id).toBe(9);
    expect(item.name).toBe('The Sunken Crypt');
  });

  it('should format metaPrimary as "Tier N" when tier is set', () => {
    const item = encounterToRosterItem(makeEncounter({ tier: 3 }));
    expect(item.metaPrimary).toBe('Tier 3');
  });

  it('should format metaPrimary as "Mixed Tier" when tier is unset', () => {
    const item = encounterToRosterItem(makeEncounter({ tier: undefined }));
    expect(item.metaPrimary).toBe('Mixed Tier');
  });

  it('should format metaSecondary as spent/suggested battle points', () => {
    const item = encounterToRosterItem(makeEncounter({ spentBattlePoints: 12, suggestedBattlePoints: 20 }));
    expect(item.metaSecondary).toBe('12/20 pts');
  });

  it('should never set a badge', () => {
    const item = encounterToRosterItem(makeEncounter());
    expect(item.badge).toBeUndefined();
  });
});
