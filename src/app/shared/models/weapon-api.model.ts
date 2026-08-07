import { FeatureInput } from './feature-api.model';

export type WeaponTrait = 'AGILITY' | 'STRENGTH' | 'FINESSE' | 'INSTINCT' | 'PRESENCE' | 'KNOWLEDGE';

/**
 * `OUT_OF_RANGE` exists in the backend `Range` enum and so can come back on a response, but it
 * is not a range anything is printed with — keep it out of pickers.
 */
export type WeaponRange = 'MELEE' | 'VERY_CLOSE' | 'CLOSE' | 'FAR' | 'VERY_FAR' | 'OUT_OF_RANGE';

/** Ranges a weapon can actually be given, in printed order. */
export const SELECTABLE_WEAPON_RANGES: readonly WeaponRange[] = [
  'MELEE', 'VERY_CLOSE', 'CLOSE', 'FAR', 'VERY_FAR',
] as const;

export type WeaponBurden = 'ONE_HANDED' | 'TWO_HANDED';
/**
 * `PHYSICAL_AND_MAGIC` is a dual damage type (e.g. Shadowblade's "Otherworldly" feature):
 * the wielder elects physical OR magic damage per attack, not both at once. Display logic
 * must never render it as combined/simultaneous damage.
 */
export type DamageType = 'PHYSICAL' | 'MAGIC' | 'PHYSICAL_AND_MAGIC';
/**
 * `D20` is rare but real — Runes of Ruination and the Bloodstaff are both printed with it — so
 * omitting it meant the catalogue could hold weapons the UI could not describe.
 */
export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20';

export interface WeaponDamageResponse {
  diceCount: number | null;
  diceType: DiceType;
  modifier: number | null;
  damageType: DamageType;
  notation: string;
}

export interface WeaponCostTag {
  id: number;
  label: string;
  category: string;
}

export interface WeaponModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface WeaponFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: WeaponCostTag[];
  modifierIds: number[];
  modifiers: WeaponModifierResponse[];
}

export interface WeaponResponse {
  id: number;
  name: string;
  /** Null for custom weapons, which came from no sourcebook. */
  expansionId: number | null;
  expansion?: { id: number; name: string; isPublished: boolean };
  tier: number;
  isOfficial: boolean;
  /** Visible to every user. Only moderators and above can set this. */
  isPublic: boolean;
  /**
   * Author of a custom weapon. Null for official imports; a non-null value alongside
   * `isOfficial: false` is what marks a weapon as homebrew.
   */
  createdByUserId?: number | null;
  /** Campaigns this weapon has been explicitly shared with. */
  campaignIds?: number[];
  isPrimary: boolean;
  trait: WeaponTrait;
  range: WeaponRange;
  burden: WeaponBurden;
  damage: WeaponDamageResponse;
  featureIds?: number[];
  features?: WeaponFeatureResponse[];
  originalWeaponId?: number | null;
  createdAt: string;
  lastModifiedAt: string;
}

/** Damage as sent when creating or updating. `diceCount` is omitted — it comes from Proficiency. */
export interface WeaponDamageRequest {
  diceType: DiceType;
  modifier?: number | null;
  damageType: DamageType;
}

/**
 * Payload for `POST /api/dh/weapons/custom`.
 *
 * Has no `isOfficial`, `expansionId`, or `originalWeaponId`: custom content is never canon,
 * belongs to no sourcebook, and only the copy endpoint may record a source. The server resolves
 * all three regardless of what is sent, so they are omitted rather than ignored.
 */
export interface CreateCustomWeaponRequest {
  name: string;
  tier: number;
  /** Honoured only for moderators and above; silently coerced to false otherwise. */
  isPublic?: boolean;
  /** The caller must be involved in every campaign named here. */
  campaignIds?: number[];
  isPrimary: boolean;
  trait: WeaponTrait;
  range: WeaponRange;
  burden: WeaponBurden;
  damage: WeaponDamageRequest;
  features?: FeatureInput[];
}

/** Payload for `PUT /api/dh/weapons/{id}`. Every field is optional; omitted means unchanged. */
export interface UpdateWeaponRequest extends Partial<Omit<CreateCustomWeaponRequest, 'damage'>> {
  damage?: WeaponDamageRequest;
  /**
   * Removes the sourcebook. Needed because a JSON `null` for `expansionId` is indistinguishable
   * from the field being omitted, and omitted means "leave unchanged".
   */
  clearExpansion?: boolean;
  /** Honoured only for moderators and above. */
  isOfficial?: boolean;
  expansionId?: number;
}
