import { CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { AdversaryApiResponse, AdversaryFeature, ExperienceResponse } from '../models/adversary-api.model';

/**
 * `Feature.timing` is null on every row in the DB (a known, deferred data issue -- see
 * `adversary.mapper.spec.ts`). The printed timing survives as a name suffix instead, e.g.
 * `"Relentless (3) - Passive"`, `"Earth Eruption - Action"`, `"Team-Up - Reaction"`. A name with
 * no recognized suffix is returned unchanged, with no timing.
 */
const FEATURE_TIMING_SUFFIX = /^(.+?)\s*-\s*(Passive|Action|Reaction)$/i;

function parseFeatureTiming(name: string): { name: string; timing?: string } {
  const match = FEATURE_TIMING_SUFFIX.exec(name);
  if (!match) return { name };

  const [, cleanName, timing] = match;
  return { name: cleanName.trim(), timing: timing.charAt(0).toUpperCase() + timing.slice(1).toLowerCase() };
}

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
