export type ReferenceCategory =
  | 'domains' | 'classes' | 'subclasses' | 'ancestries' | 'communities'
  | 'domainCards' | 'weapons' | 'armor' | 'loot' | 'companions' | 'adversaries';

export interface CategoryConfig {
  id: ReferenceCategory;
  label: string;
  description: string;
  icon: string;
  endpoint: string;
}

export type FilterControlType = 'dropdown' | 'toggle' | 'multiselect' | 'dynamic-dropdown';

export interface FilterDefinition {
  key: string;
  label: string;
  type: FilterControlType;
  options?: { value: string | number | boolean; label: string }[];
  dynamicSource?: 'expansions' | 'classes' | 'domains';
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { id: 'domains', label: 'Domains', description: 'Magic and skill domains', icon: '✨', endpoint: '/dh/domains' },
  { id: 'classes', label: 'Classes', description: 'Character classes and their abilities', icon: '⚔️', endpoint: '/dh/classes' },
  { id: 'subclasses', label: 'Subclasses', description: 'Specializations and paths within each class', icon: '🎯', endpoint: '/dh/cards/subclass' },
  { id: 'ancestries', label: 'Ancestries', description: 'Racial and cultural origins', icon: '🌿', endpoint: '/dh/cards/ancestry' },
  { id: 'communities', label: 'Communities', description: 'Community backgrounds', icon: '🏘️', endpoint: '/dh/cards/community' },
  { id: 'domainCards', label: 'Domain Cards', description: 'Spells, abilities, and grimoire entries', icon: '📜', endpoint: '/dh/cards/domain' },
  { id: 'weapons', label: 'Weapons', description: 'Arms and armaments', icon: '🗡️', endpoint: '/dh/weapons' },
  { id: 'armor', label: 'Armor', description: 'Protective gear and equipment', icon: '🛡️', endpoint: '/dh/armors' },
  { id: 'loot', label: 'Loot', description: 'Treasure and consumable items', icon: '💰', endpoint: '/dh/loot' },
  { id: 'companions', label: 'Companions', description: 'Animal and creature companions', icon: '🐺', endpoint: '/dh/companions' },
  { id: 'adversaries', label: 'Adversaries', description: 'Enemies and creatures', icon: '👹', endpoint: '/dh/adversaries' },
];

export const CATEGORY_FILTERS: Partial<Record<ReferenceCategory, FilterDefinition[]>> = {
  subclasses: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'classId', label: 'Class', type: 'dynamic-dropdown', dynamicSource: 'classes' },
    { key: 'level', label: 'Level', type: 'dropdown', options: [
      { value: 'FOUNDATION', label: 'Foundation' },
      { value: 'SPECIALIZATION', label: 'Specialization' },
      { value: 'MASTERY', label: 'Mastery' },
    ]},
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  ancestries: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  communities: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  domainCards: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'domainId', label: 'Domain', type: 'dynamic-dropdown', dynamicSource: 'domains' },
    { key: 'cardType', label: 'Type', type: 'dropdown', options: [
      { value: 'SPELL', label: 'Spell' },
      { value: 'GRIMOIRE', label: 'Grimoire' },
      { value: 'ABILITY', label: 'Ability' },
      { value: 'TRANSFORMATION', label: 'Transformation' },
      { value: 'WILD', label: 'Wild' },
    ]},
    { key: 'level', label: 'Level', type: 'dropdown', options: [
      { value: 1, label: 'Level 1' }, { value: 2, label: 'Level 2' },
      { value: 3, label: 'Level 3' }, { value: 4, label: 'Level 4' },
    ]},
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  weapons: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'trait', label: 'Trait', type: 'dropdown', options: [
      { value: 'AGILITY', label: 'Agility' }, { value: 'STRENGTH', label: 'Strength' },
      { value: 'FINESSE', label: 'Finesse' }, { value: 'INSTINCT', label: 'Instinct' },
      { value: 'PRESENCE', label: 'Presence' }, { value: 'KNOWLEDGE', label: 'Knowledge' },
    ]},
    { key: 'range', label: 'Range', type: 'dropdown', options: [
      { value: 'MELEE', label: 'Melee' }, { value: 'RANGED', label: 'Ranged' },
      { value: 'VERY_CLOSE', label: 'Very Close' }, { value: 'CLOSE', label: 'Close' },
      { value: 'FAR', label: 'Far' },
    ]},
    { key: 'burden', label: 'Burden', type: 'dropdown', options: [
      { value: 'ONE_HANDED', label: 'One-Handed' }, { value: 'TWO_HANDED', label: 'Two-Handed' },
    ]},
    { key: 'tier', label: 'Tier', type: 'dropdown', options: [
      { value: 1, label: 'Tier 1' }, { value: 2, label: 'Tier 2' }, { value: 3, label: 'Tier 3' },
    ]},
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  armor: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'tier', label: 'Tier', type: 'dropdown', options: [
      { value: 1, label: 'Tier 1' }, { value: 2, label: 'Tier 2' }, { value: 3, label: 'Tier 3' },
    ]},
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  loot: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'tier', label: 'Tier', type: 'dropdown', options: [
      { value: 1, label: 'Tier 1' }, { value: 2, label: 'Tier 2' }, { value: 3, label: 'Tier 3' },
    ]},
    { key: 'isConsumable', label: 'Consumable Only', type: 'toggle' },
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
  adversaries: [
    { key: 'expansionId', label: 'Expansion', type: 'dynamic-dropdown', dynamicSource: 'expansions' },
    { key: 'tier', label: 'Tier', type: 'dropdown', options: [
      { value: 1, label: 'Tier 1' }, { value: 2, label: 'Tier 2' }, { value: 3, label: 'Tier 3' },
    ]},
    { key: 'adversaryType', label: 'Type', type: 'dropdown', options: [
      { value: 'MINION', label: 'Minion' }, { value: 'STANDARD', label: 'Standard' },
      { value: 'BRUISER', label: 'Bruiser' }, { value: 'SKULK', label: 'Skulk' },
      { value: 'SOCIAL', label: 'Social' }, { value: 'SUPPORT', label: 'Support' },
      { value: 'RANGED', label: 'Ranged' }, { value: 'CONTROLLER', label: 'Controller' },
      { value: 'LEADER', label: 'Leader' }, { value: 'SOLO', label: 'Solo' },
    ]},
    { key: 'isOfficial', label: 'Official Only', type: 'toggle' },
  ],
};
