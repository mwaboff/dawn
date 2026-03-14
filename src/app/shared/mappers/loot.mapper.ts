import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { LootApiResponse, LootFeature } from '../models/loot-api.model';

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

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'loot' as never,
    tags: tags.length > 0 ? tags : undefined,
    features: features?.length ? features : undefined,
    metadata: {
      tier: response.tier,
      isConsumable: response.isConsumable,
      expansionId: response.expansionId,
      isOfficial: response.isOfficial,
    },
  };
}
