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

export interface CompanionClassFeatureReminder {
  label: string;
  text: string;
}

/**
 * Beastbound Specialization/Mastery features that affect the companion but are neither Training
 * options nor the Foundation grant, so have nowhere else in this UI to be shown. VERBATIM text --
 * `resources/rules/chapters/core-01-preparing-for-adventure.md:1255,1261`. Matched the same way
 * as `hasCompanionFeature`: case/whitespace-insensitive name match AND `featureType === 'SUBCLASS'`.
 */
const COMPANION_CLASS_FEATURE_REMINDERS: readonly (CompanionClassFeatureReminder & { featureName: string })[] = [
  {
    featureName: 'battle-bonded',
    label: 'Battle-Bonded',
    text: "When an adversary attacks you while they're within your companion's Melee range, you gain a +2 bonus to your Evasion against the attack.",
  },
  {
    featureName: 'loyal friend',
    label: 'Loyal Friend',
    text: "Once per long rest, when the damage from an attack would mark your companion's last Stress or your last Hit Point and you're within Close range of each other, you or your companion can rush to the other's side and take that damage instead.",
  },
];

/**
 * Reminders for whichever of `COMPANION_CLASS_FEATURE_REMINDERS` the character actually has,
 * gated on `subclassCards` so a character without the Specialization/Mastery card sees neither.
 * Returns `[]` (never throws) for an absent `subclassCards` array.
 */
export function companionClassFeatureReminders(
  subclassCards: SubclassCardResponse[] | undefined,
): CompanionClassFeatureReminder[] {
  const cards = subclassCards ?? [];
  return COMPANION_CLASS_FEATURE_REMINDERS
    .filter(({ featureName }) =>
      cards.some(card =>
        (card.features ?? []).some(
          feature => feature.name?.trim().toLowerCase() === featureName && feature.featureType === 'SUBCLASS',
        ),
      ),
    )
    .map(({ label, text }) => ({ label, text }));
}
