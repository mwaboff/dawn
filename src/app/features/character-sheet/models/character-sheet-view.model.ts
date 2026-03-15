export interface CharacterSheetView {
  id: number;
  ownerId: number;
  name: string;
  pronouns?: string;
  level: number;

  evasion: DisplayStat;
  hitPointMax: DisplayStat;
  armorScore: DisplayStat;
  majorDamageThreshold: DisplayStat;
  severeDamageThreshold: DisplayStat;
  hopeMax: DisplayStat;
  stressMax: DisplayStat;

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

  subclassCards: SubclassCardSummary[];
  ancestryCards: CardSummary[];
  communityCards: CardSummary[];
  domainCards: DomainCardSummary[];
  inventoryWeapons: WeaponDisplay[];
  inventoryArmors: ArmorDisplay[];
  inventoryItems: LootDisplay[];

  experiences: ExperienceDisplay[];
  classEntries: ClassEntry[];
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
  modifier: number;
  marked: boolean;
}

export interface WeaponDisplay {
  id: number;
  name: string;
  damage: string;
  trait: string;
  range: string;
  burden: string;
  features: FeatureDisplay[];
}

export interface ArmorDisplay {
  id: number;
  name: string;
  baseScore: number;
  features: FeatureDisplay[];
}

export interface LootDisplay {
  id: number;
  name: string;
  description?: string;
  isConsumable: boolean;
  costTags: string[];
}

export interface FeatureDisplay {
  name: string;
  description: string;
  tags: string[];
}

export interface CardSummary {
  id: number;
  name: string;
  description?: string;
  features: FeatureDisplay[];
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
