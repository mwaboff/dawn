export interface CharacterSheetData {
  name: string;
  pronouns?: string;
  level: number;

  evasion: number;
  hitPointMax: number;
  hitPointMarked: number;

  hopeMax: number;
  hopeMarked: number;

  stressMax: number;
  stressMarked: number;

  armorMax: number;
  armorMarked: number;

  majorDamageThreshold: number;
  severeDamageThreshold: number;

  agilityModifier: number;
  strengthModifier: number;
  finesseModifier: number;
  instinctModifier: number;
  presenceModifier: number;
  knowledgeModifier: number;

  agilityMarked: boolean;
  strengthMarked: boolean;
  finesseMarked: boolean;
  instinctMarked: boolean;
  presenceMarked: boolean;
  knowledgeMarked: boolean;

  gold: number;

  activePrimaryWeaponId: number | null;
  activeSecondaryWeaponId: number | null;
  activeArmorId: number | null;

  inventoryWeaponIds: number[];
  inventoryArmorIds: number[];

  communityCardIds: number[];
  ancestryCardIds: number[];
  subclassCardIds: number[];
  domainCardIds: number[];
  equippedDomainCardIds: number[];
  vaultDomainCardIds: number[];

  experiences: { name: string; modifier: number }[];
}

export const DEFAULT_MAJOR_THRESHOLD = 3;
export const DEFAULT_SEVERE_THRESHOLD = 6;
