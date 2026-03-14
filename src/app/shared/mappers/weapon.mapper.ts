import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { WeaponFeatureResponse, WeaponModifierResponse, WeaponResponse } from '../models/weapon-api.model';

function formatTitleCase(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatBurden(burden: string): string {
  return burden === 'TWO_HANDED' ? 'Two-Handed' : 'One-Handed';
}

function mapFeature(feature: WeaponFeatureResponse): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: 'Weapon Feature',
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

export function mapWeaponResponseToCardData(response: WeaponResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);
  const formattedRange = formatTitleCase(response.range);
  const formattedBurden = formatBurden(response.burden);
  const formattedTrait = formatTitleCase(response.trait);
  const subtitle = response.damage.damageType === 'MAGIC' ? 'Magic Weapon' : 'Physical Weapon';

  const modifiers: WeaponModifierResponse[] = (response.features ?? [])
    .flatMap(f => f.modifiers ?? []);

  return {
    id: response.id,
    name: response.name,
    description: '',
    cardType: 'weapon',
    subtitle,
    tags: [response.damage.notation, formattedRange, formattedBurden, formattedTrait],
    features: features.length > 0 ? features : undefined,
    metadata: {
      isPrimary: response.isPrimary,
      burden: response.burden,
      damageType: response.damage.damageType,
      trait: response.trait,
      range: response.range,
      tier: response.tier,
      damage: response.damage,
      modifiers,
    },
  };
}
