import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { DamageType, WeaponFeatureResponse, WeaponModifierResponse, WeaponResponse } from '../models/weapon-api.model';
import { CUSTOM_CONTENT_TAG, isCustomContent } from './custom-content.util';

function formatTitleCase(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats the weapon card subtitle for a damage type. `PHYSICAL_AND_MAGIC` is an either/or
 * choice made per attack (e.g. Shadowblade's "Otherworldly" feature) — it must read as a
 * choice, never as combined/simultaneous damage.
 */
function formatDamageTypeSubtitle(damageType: DamageType): string {
  switch (damageType) {
    case 'MAGIC':
      return 'Magic Weapon';
    case 'PHYSICAL_AND_MAGIC':
      return 'Physical or Magic Weapon';
    case 'PHYSICAL':
    default:
      return 'Physical Weapon';
  }
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
  const subtitle = formatDamageTypeSubtitle(response.damage.damageType);

  const modifiers: WeaponModifierResponse[] = (response.features ?? [])
    .flatMap(f => f.modifiers ?? []);

  return {
    id: response.id,
    name: response.name,
    description: '',
    cardType: 'weapon',
    subtitle,
    subtitleSecondary: `Tier ${response.tier}`,
    tags: [
      response.damage.notation, formattedRange, formattedBurden, formattedTrait,
      ...(isCustomContent(response) ? [CUSTOM_CONTENT_TAG] : []),
    ],
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      isPrimary: response.isPrimary,
      burden: response.burden,
      damageType: response.damage.damageType,
      trait: response.trait,
      range: response.range,
      tier: response.tier,
      damage: response.damage,
      modifiers,
      createdByUserId: response.createdByUserId ?? null,
    },
  };
}
