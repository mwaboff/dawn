import { ComboDieType } from '../../create-character/models/character-sheet-api.model';
import { DiceType } from '../../../shared/models/dice-roller.model';

export interface CharacterSheetView {
  id: number;
  ownerId: number;
  ownerName?: string;
  name: string;
  pronouns?: string;
  level: number;

  proficiency: DisplayStat;
  evasion: DisplayStat;
  hitPointMax: DisplayStat;
  armorScore: DisplayStat;
  majorDamageThreshold: DisplayStat;
  severeDamageThreshold: DisplayStat;
  hopeMax: DisplayStat;
  stressMax: DisplayStat;
  /**
   * True when the equipped armor is restricted (SRD vs. paid-expansion content gating). `armorScore`
   * /`majorDamageThreshold`/`severeDamageThreshold` still hold real numbers when this is true --
   * the equipped armor's own base numbers are redacted, so `mapToCharacterSheetView` computes
   * those three as if it contributed nothing, purely so the Armor pip tracker's `max` has a number
   * to render against. That fallback is never the whole story (a hidden armor still contributes
   * whatever it contributes), so this flag is what tells a template to mark the stat as incomplete
   * rather than presenting the fallback as fact -- see `CharacterSheet.html`'s Armor/Major/Severe
   * stat boxes and the beta equivalent.
   */
  armorRestricted: boolean;

  hitPointMarked: number;
  armorMarked: number;
  armorMax: number;
  hopeMarked: number;
  stressMarked: number;
  gold: number;

  traits: TraitDisplay[];

  activePrimaryWeapon: WeaponDisplay | null;
  activeSecondaryWeapon: WeaponDisplay | null;
  activeArmor: ArmorDisplay | null;

  classCards: CardSummary[];
  subclassCards: SubclassCardSummary[];
  ancestryCards: CardSummary[];
  communityCards: CardSummary[];
  domainCards: DomainCardSummary[];
  equippedDomainCards: DomainCardSummary[];
  vaultDomainCards: DomainCardSummary[];
  maxEquippedDomainCards: number;
  inventoryWeapons: WeaponDisplay[];
  inventoryArmors: ArmorDisplay[];
  inventoryItems: LootDisplay[];

  experiences: ExperienceDisplay[];
  classEntries: ClassEntry[];
  notes?: string;
  comboDie?: ComboDieType;
}

export interface ClassEntry {
  className: string;
  subclassName?: string;
}

export interface ModifierSource {
  sourceName: string;
  operation: 'SET' | 'MULTIPLY' | 'ADD';
  value: number;
}

export interface DisplayStat {
  base: number;
  modified: number;
  hasModifier: boolean;
  modifierSources: ModifierSource[];
}

export const TRAIT_SUBSKILLS: Record<string, string[]> = {
  Agility: ['Sprint', 'Leap', 'Maneuver'],
  Strength: ['Lift', 'Smash', 'Grapple'],
  Finesse: ['Control', 'Hide', 'Tinker'],
  Instinct: ['Perceive', 'Sense', 'Navigate'],
  Presence: ['Charm', 'Perform', 'Deceive'],
  Knowledge: ['Recall', 'Analyze', 'Comprehend'],
};

export interface TraitDisplay {
  name: string;
  abbreviation: string;
  modifier: DisplayStat;
  marked: boolean;
}

export interface WeaponDisplay {
  id: number;
  inventoryEntryId: number;
  /**
   * Author of a custom weapon, null for official content. Carried through so the inventory can
   * offer an edit shortcut on gear the viewer wrote and nothing else.
   */
  createdByUserId?: number | null;
  name: string;
  tier?: number;
  isPrimary: boolean;
  /**
   * True when the backend redacted this weapon because the viewer lacks access to its expansion
   * (SRD vs. paid-expansion content gating). `name` still holds safe placeholder text (see
   * `buildRestrictedWeaponDisplay`) and `damage`/`trait`/`range`/`burden`/`features` are empty --
   * check this flag before drawing the normal equipped-weapon face.
   */
  restricted?: boolean;
  /** The paid book this weapon belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
  damage: string;
  /**
   * Structured counterpart of `damage`, alongside it (not a replacement — the classic sheet
   * still reads the formatted string). Null when the weapon has no damage roll, or its
   * `diceType` doesn't normalize to a known `DiceType`. `diceCount` stays `null` when the API
   * omitted it, so a roll-request builder can fall back to the wielder's current Proficiency
   * instead of baking in the value that was current at mapping time.
   */
  damageDice?: WeaponDamageDice | null;
  trait: string;
  range: string;
  burden: string;
  features: FeatureDisplay[];
}

export interface WeaponDamageDice {
  type: DiceType;
  diceCount: number | null;
  modifier: number;
}

export interface ArmorDisplay {
  id: number;
  inventoryEntryId: number;
  /** See `WeaponDisplay.createdByUserId`. */
  createdByUserId?: number | null;
  name: string;
  tier?: number;
  /** See `WeaponDisplay.restricted`. `baseScore`/`baseMajorThreshold`/`baseSevereThreshold` are 0
   * and `features` is empty when this is true. */
  restricted?: boolean;
  /** See `WeaponDisplay.expansionName`. */
  expansionName?: string;
  baseScore: number;
  baseMajorThreshold: number;
  baseSevereThreshold: number;
  features: FeatureDisplay[];
}

export interface LootDisplay {
  id: number;
  inventoryEntryId: number;
  /** See `WeaponDisplay.createdByUserId`. */
  createdByUserId?: number | null;
  name: string;
  description?: string;
  isConsumable: boolean;
  costTags: string[];
  /** See `WeaponDisplay.restricted`. `description` holds the locked-card message (not real loot
   * text) when this is true. */
  restricted?: boolean;
  /** See `WeaponDisplay.expansionName`. */
  expansionName?: string;
}

export interface FeatureDisplay {
  name: string;
  description: string;
  tags: string[];
  modifiers: FeatureModifierDisplay[];
}

export interface FeatureModifierDisplay {
  label: string;
  value: number;
  operation: 'SET' | 'MULTIPLY' | 'ADD';
  target: string;
}

export interface CardSummary {
  id: number;
  name: string;
  description?: string;
  features: FeatureDisplay[];
  /**
   * True when the backend redacted this card because the viewer lacks access to its expansion
   * (SRD vs. paid-expansion content gating). `name`/`description` still hold safe placeholder
   * text (see `buildRestrictedCardSummary`) and `features` is empty -- check this flag to draw
   * the locked look instead of the normal card.
   */
  restricted?: boolean;
  /** The paid book this card belongs to, present only alongside `restricted: true` and only when
   * the backend knows it. */
  expansionName?: string;
}

export interface SubclassCardSummary extends CardSummary {
  associatedClassId?: number;
  associatedClassName?: string;
  subclassPathName?: string;
  domainNames?: string[];
  level?: string;
}

export interface DomainCardSummary extends CardSummary {
  domainName?: string;
  level?: number;
  recallCost?: number;
  type?: string;
}

export interface ExperienceDisplay {
  id: number;
  description: string;
  modifier: number;
}
