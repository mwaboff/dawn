import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { CompanionApiResponse } from '../models/companion-api.model';

function formatRange(range: string): string {
  return range.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function mapCompanionToCardData(response: CompanionApiResponse): CardData {
  const tags: string[] = [];
  if (response.attackRange) tags.push(formatRange(response.attackRange));
  if (response.damageDice) tags.push(response.damageDice);

  const features: CardFeature[] = [];
  features.push({
    name: response.attackName,
    description: `Range: ${formatRange(response.attackRange)} · Damage: ${response.damageDice}`,
    tags: [],
  });

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'companion',
    tags: tags.length > 0 ? tags : undefined,
    features: features.length > 0 ? features : undefined,
    metadata: {
      evasion: response.evasion,
      stressMax: response.stressMax,
      stressMarked: response.stressMarked,
      attackName: response.attackName,
      attackRange: response.attackRange,
      damageDice: response.damageDice,
    },
  };
}
