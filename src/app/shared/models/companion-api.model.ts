/**
 * Attack range for a companion, mirroring the backend's `Range` enum minus `OUT_OF_RANGE` --
 * a companion's printed/derived attack range never reaches that value (it is not part of the
 * Vicious range ladder either). Matches the same 5-value shape as `WeaponRange`/`BeastformRange`
 * elsewhere in this codebase, kept as its own declaration per this codebase's convention of
 * per-domain range types rather than one shared cross-imported type.
 */
export type CompanionRange = 'MELEE' | 'VERY_CLOSE' | 'CLOSE' | 'FAR' | 'VERY_FAR';

/** Damage dice a companion's attack can roll -- the Vicious damage-die ladder tops out at D12. */
export type CompanionDiceType = 'D6' | 'D8' | 'D10' | 'D12';

/**
 * A companion's attack is always physical or magic, never `PHYSICAL_AND_MAGIC` (that "Otherworldly"
 * either/or mechanic is weapon-only) -- core-01:1327, "Choose whether they deal physical or magic
 * damage." Settable on both `CreateCompanionRequest` and `UpdateCompanionRequest`; the backend
 * rejects `PHYSICAL_AND_MAGIC` for a companion.
 */
export type CompanionDamageType = 'PHYSICAL' | 'MAGIC';

export type CompanionOrigin = 'SUBCLASS_FEATURE' | 'GM_GRANTED' | 'MANUAL';

export type ViciousAxis = 'DAMAGE_DIE' | 'RANGE';

export type CompanionTrainingOption =
  | 'INTELLIGENT'
  | 'LIGHT_IN_THE_DARK'
  | 'CREATURE_COMFORT'
  | 'ARMORED'
  | 'VICIOUS'
  | 'RESILIENT'
  | 'BONDED'
  | 'AWARE';

/**
 * A companion-owned Experience. Shares the same `experiences` table and endpoints as a
 * character's own Experiences (`POST /api/dh/experiences` with `companionId` set instead of
 * `characterSheetId` -- exactly one of the two is ever set), but is declared here rather than
 * imported from `features/create-character/models/character-sheet-api.model.ts`'s
 * `ExperienceResponse`, since shared code must never import from `features/`.
 */
export interface CompanionExperienceApiResponse {
  id: number;
  companionId: number;
  description: string;
  modifier: number;
}

export interface CompanionTrainingApiResponse {
  id: number;
  option: CompanionTrainingOption;
  viciousAxis?: ViciousAxis;
  targetExperienceId?: number;
  acquiredAtLevel: number;
}

/**
 * A companion's four printed stats (Evasion, Stress max, damage dice, attack range) are stored
 * as `base*` values and never mutated by Training; the Training-adjusted values actually used in
 * play are always the non-`base*`-prefixed fields, computed server-side at read time. `trainings`
 * and `remainingByOption` are always included (not `?expand=`-gated); `experiences` requires
 * `?expand=experiences`.
 */
export interface CompanionApiResponse {
  id: number;
  characterSheetId: number;
  name: string;
  description?: string;
  evasion: number;
  baseEvasion: number;
  attackName: string;
  attackRange: CompanionRange;
  baseAttackRange: CompanionRange;
  damageDice: CompanionDiceType;
  baseDamageDice: CompanionDiceType;
  /** The owning character's live Proficiency -- number of dice rolled. Never snapshotted. */
  attackDiceCount: number;
  damageType: CompanionDamageType;
  stressMax: number;
  baseStressMax: number;
  stressMarked: number;
  outOfScene: boolean;
  origin: CompanionOrigin;
  advancesOnLevelUp: boolean;
  trainings: CompanionTrainingApiResponse[];
  remainingByOption: Partial<Record<CompanionTrainingOption, number>>;
  experiences?: CompanionExperienceApiResponse[];
  createdAt: string;
  lastModifiedAt: string;
}

export interface CreateCompanionRequest {
  characterSheetId: number;
  name: string;
  description?: string;
  evasion?: number;
  attackName: string;
  attackRange: CompanionRange;
  damageDice: CompanionDiceType;
  /** Defaults server-side to `PHYSICAL` when omitted. */
  damageType?: CompanionDamageType;
  stressMax?: number;
  stressMarked?: number;
}

/** All fields optional -- partial update, matching `PUT /api/dh/companions/{id}`. */
export interface UpdateCompanionRequest {
  name?: string;
  description?: string;
  evasion?: number;
  attackName?: string;
  attackRange?: CompanionRange;
  damageDice?: CompanionDiceType;
  damageType?: CompanionDamageType;
  stressMax?: number;
  stressMarked?: number;
}

export interface CreateCompanionTrainingRequest {
  option: CompanionTrainingOption;
  /** Required iff `option === 'VICIOUS'`. */
  viciousAxis?: ViciousAxis;
  /** Required iff `option === 'INTELLIGENT'`; must belong to this companion. */
  targetExperienceId?: number;
}
