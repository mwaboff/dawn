import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { LootApiResponse, LootFeature } from '../models/loot-api.model';
import { CUSTOM_CONTENT_TAG, isCustomContent } from './custom-content.util';

function mapLootFeature(feature: LootFeature): CardFeature {
  return {
    name: feature.name,
    description: feature.description ?? '',
  };
}

export function mapLootToCardData(response: LootApiResponse): CardData {
  const features = response.features?.map(mapLootFeature);
  const tags: string[] = [];

  if (response.tier !== undefined) {
    tags.push(`Tier ${response.tier}`);
  }
  if (response.isConsumable) {
    tags.push('Consumable');
  }
  if (response.costTags?.length) {
    tags.push(...response.costTags);
  }
  if (isCustomContent(response)) {
    tags.push(CUSTOM_CONTENT_TAG);
  }

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'loot' as never,
    tags: tags.length > 0 ? tags : undefined,
    // "Consumable" is a subtype of loot rather than a kind of card, so on the beta face it is the
    // subtitle and the tab keeps saying "Loot". Cost tags are the one stat that needs no label:
    // "1 HANDFUL" already names its own unit.
    entityDisplay: {
      subtitle: response.isConsumable ? 'Consumable' : undefined,
      scalar: response.tier !== undefined ? { label: 'Tier', value: String(response.tier) } : undefined,
      stats: response.costTags?.length ? response.costTags.map(tag => ({ value: tag })) : undefined,
    },
    features: features?.length ? features : undefined,
    metadata: {
      tier: response.tier,
      isConsumable: response.isConsumable,
      expansionId: response.expansionId,
      isOfficial: response.isOfficial,
      createdByUserId: response.createdByUserId ?? null,
    },
  };
}
