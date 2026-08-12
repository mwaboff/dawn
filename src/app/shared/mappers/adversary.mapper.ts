import { CardFeature, RESTRICTED_CARD_TITLE } from '../components/daggerheart-card/daggerheart-card.model';
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
  // A redacted stub carries nothing else safe to read. `tier`/`adversaryType` are optional on
  // `AdversaryData` precisely for this case -- they stay absent rather than filled with a `0`/`''`
  // that could read as fact. `AdversaryCard` (the classic adversary face) branches on `restricted`
  // before ever displaying them -- see its own `@if (adversary().restricted)` template branch. The
  // beta face's redaction lives in `adversary-data-to-entity-card.mapper.ts`'s
  // `adversaryToEntityCard`.
  if (response.restricted) {
    return {
      id: response.id,
      name: RESTRICTED_CARD_TITLE,
      restricted: true,
      expansionName: response.expansionName,
    };
  }

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
    srd: response.srd,
    features: features?.length ? features : undefined,
    experiences: experiences?.length ? experiences : undefined,
  };
}
