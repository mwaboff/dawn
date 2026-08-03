import { CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { AdversaryApiResponse, AdversaryFeature, ExperienceResponse } from '../models/adversary-api.model';
import { parseFeatureTiming } from '../utils/feature-timing.utils';

function mapAdversaryFeature(feature: AdversaryFeature): CardFeature {
  const { name, timing } = parseFeatureTiming(feature.name);
  return {
    name,
    description: feature.description ?? '',
    subtitle: timing,
  };
}

function mapAdversaryExperience(experience: ExperienceResponse): { description: string; modifier: number } {
  return { description: experience.description, modifier: experience.modifier };
}

export function mapAdversaryToAdversaryData(response: AdversaryApiResponse): AdversaryData {
  const features = response.features?.map(mapAdversaryFeature);
  const experiences = response.experiences?.map(mapAdversaryExperience);

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
    expansionId: response.expansionId,
    features: features?.length ? features : undefined,
    experiences: experiences?.length ? experiences : undefined,
  };
}
