import { SubclassCardResponse } from '../../create-character/models/character-sheet-api.model';

/**
 * Name of the Beastbound Ranger foundation feature that grants a companion. Unlike the other
 * `has*Feature` gates in this directory (`hasMartialStances`, `hasWarlockResources`,
 * `hasBeastformFeature`), "Companion" is not matched on name alone: production data has a
 * *second*, unrelated feature also named "Companion" with `featureType: 'BEASTFORM'` (confirmed
 * against the production database), so a name-only match would risk a false positive. The
 * `featureType === 'SUBCLASS'` check is load-bearing here, not defensive.
 */
const COMPANION_FEATURE_NAME = 'companion';

/**
 * True when any of the character's subclass cards has the Beastbound Ranger's "Companion"
 * foundation feature. Matched case/whitespace-insensitively on name (like every other `has*
 * Feature` gate, so homebrew subclasses granting the same feature also work), AND on
 * `featureType === 'SUBCLASS'` to rule out the unrelated same-named Beastform feature. Returns
 * `false` (never throws) for an absent `subclassCards` array.
 */
export function hasCompanionFeature(subclassCards: SubclassCardResponse[] | undefined): boolean {
  return (subclassCards ?? []).some(card =>
    (card.features ?? []).some(
      feature =>
        feature.name?.trim().toLowerCase() === COMPANION_FEATURE_NAME &&
        feature.featureType === 'SUBCLASS',
    ),
  );
}

/**
 * Whether the companion panel renders at all. A deliberate divergence from the Transformation
 * panel precedent (which hides entirely when its GM flag is off): `companionsEnabled` never
 * hides an *existing* companion, it only gates whether a new one can be created. See companions
 * plan §3.4.
 */
export function showCompanionPanel(
  hasFeature: boolean,
  companionsEnabled: boolean,
  activeCompanionCount: number,
): boolean {
  return hasFeature || companionsEnabled || activeCompanionCount > 0;
}

/** Whether the owner can create a *new* companion right now. */
export function canCreateCompanion(hasFeature: boolean, companionsEnabled: boolean): boolean {
  return hasFeature || companionsEnabled;
}
