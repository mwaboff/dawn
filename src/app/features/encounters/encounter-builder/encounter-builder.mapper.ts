import { mapAdversaryToAdversaryData } from '../../../shared/mappers/adversary.mapper';
import { mapEnvironmentToCardData } from '../../../shared/mappers/environment.mapper';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import {
  CreateEncounterRequest,
  EncounterAdjustmentFlags,
  EncounterResponse,
} from '../../../shared/models/encounter-api.model';
import { BattlePointAdjustments } from '../../../shared/utils/battle-points.utils';
import { EncounterRosterInstance } from './models/encounter-roster-instance.model';

/** Bridges the meter's short-form calculator keys onto the API's `adjustmentX` boolean fields. */
export function toApiAdjustments(local: BattlePointAdjustments): EncounterAdjustmentFlags {
  return {
    adjustmentEasier: local.easier,
    adjustmentTwoPlusSolos: local.twoPlusSolos,
    adjustmentBonusDamage: local.bonusDamage,
    adjustmentLowerTier: local.lowerTier,
    adjustmentNoElites: local.noElites,
    adjustmentHarder: local.harder,
  };
}

export function fromApiAdjustments(response: EncounterResponse): BattlePointAdjustments {
  return {
    easier: response.adjustmentEasier,
    twoPlusSolos: response.adjustmentTwoPlusSolos,
    bonusDamage: response.adjustmentBonusDamage,
    lowerTier: response.adjustmentLowerTier,
    noElites: response.adjustmentNoElites,
    harder: response.adjustmentHarder,
  };
}

export interface EncounterBuilderFormState {
  name: string;
  description: string;
  partySize: number;
  adjustments: BattlePointAdjustments;
  environmentId: number | undefined;
  roster: EncounterRosterInstance[];
}

export function buildEncounterPayload(state: EncounterBuilderFormState): CreateEncounterRequest {
  return {
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    environmentId: state.environmentId,
    partySize: state.partySize,
    ...toApiAdjustments(state.adjustments),
    adversaries: state.roster.map(i => ({
      adversaryId: i.adversaryId,
      label: i.label,
      tierOverride: i.tierOverride,
    })),
  };
}

/**
 * The encounter's environment, for display in the roster. `response.environment` is only present
 * with `?expand=environment` (the initial load), never on a create/update response -- `previous`
 * backfills it by id in that case, the same way `mapResponseToRosterInstances` backfills
 * adversary details the response didn't expand.
 */
export function mapResponseToEnvironmentCard(
  response: EncounterResponse,
  previous?: CardData,
): CardData | undefined {
  if (response.environmentId === undefined) return undefined;
  if (response.environment) return mapEnvironmentToCardData(response.environment);
  return previous?.id === response.environmentId ? previous : undefined;
}

/**
 * Adopts server-canonical roster state after a load or a save. `previousRoster` backfills
 * `AdversaryData` for instances the response didn't expand (create/update responses don't carry
 * `?expand=adversaryDetails`) by matching on display order, which the roster keeps contiguous
 * with what was just sent. An instance neither the response nor `previousRoster` can supply
 * adversary data for is dropped rather than rendered broken.
 */
export function mapResponseToRosterInstances(
  response: EncounterResponse,
  previousRoster: EncounterRosterInstance[] = [],
): EncounterRosterInstance[] {
  const sorted = response.adversaries.slice().sort((a, b) => a.displayOrder - b.displayOrder);
  const instances: EncounterRosterInstance[] = [];

  sorted.forEach((entry, index) => {
    const adversary = entry.adversary
      ? mapAdversaryToAdversaryData(entry.adversary)
      : previousRoster[index]?.adversary;
    if (!adversary) return;

    instances.push({
      localId: String(entry.id),
      adversaryId: entry.adversaryId,
      adversary,
      ...(entry.label !== undefined ? { label: entry.label } : {}),
      ...(entry.tierOverride !== undefined ? { tierOverride: entry.tierOverride } : {}),
      displayOrder: entry.displayOrder,
    });
  });

  return instances;
}
