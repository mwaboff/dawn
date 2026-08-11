import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { SubclassCardResponse, SubclassFeatureResponse } from '../models/subclass-api.model';

function mapFeature(feature: SubclassFeatureResponse): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: 'Subclass Feature',
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

export function mapSubclassResponseToCardData(response: SubclassCardResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);
  const subtitle = response.associatedClassName ?? undefined;
  const subtitleSecondary = response.domainNames?.length
    ? response.domainNames.join(' · ')
    : undefined;

  const tags: string[] | undefined = response.spellcastingTrait
    ? [`Spellcasting: ${response.spellcastingTrait.trait}`]
    : undefined;

  // Both facts are words rather than numbers, so on the beta face they are named rows instead of a
  // chip and a bare prose line. The domain list is rebuilt from `domainNames` rather than reusing
  // the joined `subtitleSecondary`, and uses the same ", " separator as the sheet's own subclass
  // card so one subclass reads identically in the browser and on the sheet.
  const meta: { label: string; value: string }[] = [];
  if (response.spellcastingTrait) {
    meta.push({ label: 'Spellcasting', value: response.spellcastingTrait.trait });
  }
  if (response.domainNames?.length) {
    meta.push({ label: 'Domains', value: response.domainNames.join(', ') });
  }

  const metadata: Record<string, unknown> = {
    expansionId: response.expansionId,
    expansionName: response.expansionName,
    subclassPathId: response.subclassPathId,
    subclassPathName: response.subclassPathName,
    associatedClassId: response.associatedClassId,
    associatedClassName: response.associatedClassName,
    level: response.level,
    domainNames: response.domainNames ?? [],
    features: response.features ?? [],
  };

  if (response.spellcastingTrait) {
    metadata['spellcastingTrait'] = response.spellcastingTrait;
  }

  return {
    id: response.id,
    name: response.name,
    description: '',
    cardType: 'subclass',
    subtitle,
    subtitleSecondary,
    tags,
    entityDisplay: meta.length > 0 ? { meta } : undefined,
    features: features.length > 0 ? features : undefined,
    metadata,
  };
}
