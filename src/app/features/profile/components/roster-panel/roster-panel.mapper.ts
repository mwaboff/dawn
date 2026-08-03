import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { EncounterResponse } from '../../../../shared/models/encounter-api.model';
import { tierRangeLabel } from '../../../../shared/utils/encounter-tier.utils';
import { RosterPanelItem } from './roster-panel.model';

export function campaignToRosterItem(campaign: CampaignResponse): RosterPanelItem {
  return {
    id: campaign.id,
    name: campaign.name,
    metaPrimary: `GM: ${campaign.creator?.username ?? 'Unknown'}`,
    metaSecondary: `${campaign.playerIds.length} players`,
    badge: campaign.isEnded ? 'Ended' : undefined,
  };
}

export function encounterToRosterItem(encounter: EncounterResponse): RosterPanelItem {
  return {
    id: encounter.id,
    name: encounter.name,
    metaPrimary: tierRangeLabel(encounter),
    metaSecondary: `${encounter.spentBattlePoints}/${encounter.suggestedBattlePoints} pts`,
  };
}
