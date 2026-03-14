import { CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { AdversaryApiResponse, AdversaryFeature } from '../models/adversary-api.model';

function mapAdversaryFeature(feature: AdversaryFeature): CardFeature {
  return {
    name: feature.name,
    description: feature.description ?? '',
  };
}

export function mapAdversaryToAdversaryData(response: AdversaryApiResponse): AdversaryData {
  const features = response.features?.map(mapAdversaryFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    tier: response.tier,
    adversaryType: response.adversaryType,
    difficulty: response.difficulty,
    hitPointMax: response.hitPointMax,
    stressMax: response.stressMax,
    evasion: response.evasion,
    majorThreshold: response.majorThreshold,
    severeThreshold: response.severeThreshold,
    attackModifier: response.attackModifier,
    weaponName: response.weaponName,
    attackRange: response.attackRange,
    damage: response.damage,
    motivesAndTactics: response.motivesAndTactics,
    features: features?.length ? features : undefined,
  };
}
