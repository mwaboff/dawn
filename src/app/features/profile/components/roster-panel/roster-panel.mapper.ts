import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { EncounterResponse } from '../../../../shared/models/encounter-api.model';
import { tierRangeLabel } from '../../../../shared/utils/encounter-tier.utils';
import { ITEM_KIND_TITLES, OwnedCustomItem, ownedItemKey } from '../../models/custom-item.model';
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

/**
 * Unlike the two above, this sets `key`: the panel holds all three item kinds at once and their
 * ids overlap, so `id` alone can't identify a row. See `RosterPanelItem.key`.
 */
export function ownedItemToRosterItem(item: OwnedCustomItem): RosterPanelItem {
  return {
    id: item.id,
    key: ownedItemKey(item),
    name: item.name,
    metaPrimary: ITEM_KIND_TITLES[item.kind],
    metaSecondary: item.detail,
  };
}
