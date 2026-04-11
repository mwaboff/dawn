import { CardSchema } from './card-edit-schema.types';

const TRAIT_OPTIONS = [
  { value: 'AGILITY', label: 'Agility' },
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'FINESSE', label: 'Finesse' },
  { value: 'INSTINCT', label: 'Instinct' },
  { value: 'PRESENCE', label: 'Presence' },
  { value: 'KNOWLEDGE', label: 'Knowledge' },
];

const BASICS_FIELDS_FULL = [
  { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
  { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
  { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
  { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
  { name: 'backgroundImageUrl', label: 'Background image URL', kind: 'url' as const, maxLength: 500, column: 'full' as const },
];

export const CARD_EDIT_SCHEMAS: Record<string, CardSchema> = {
  domainCard: {
    cardType: 'domainCard',
    sections: [
      {
        title: 'Basics',
        fields: BASICS_FIELDS_FULL,
      },
      {
        title: 'Domain card details',
        fields: [
          { name: 'associatedDomainId', label: 'Domain', kind: 'entity', lookup: 'domains', required: true, column: 1 },
          { name: 'level', label: 'Level', kind: 'number', required: true, positive: true, column: 2 },
          { name: 'recallCost', label: 'Recall cost', kind: 'number', required: true, min: 0, column: 1 },
          {
            name: 'type', label: 'Type', kind: 'enum', required: true, column: 2, options: [
              { value: 'SPELL', label: 'Spell' },
              { value: 'GRIMOIRE', label: 'Grimoire' },
              { value: 'ABILITY', label: 'Ability' },
              { value: 'TRANSFORMATION', label: 'Transformation' },
              { value: 'WILD', label: 'Wild' },
            ],
          },
        ],
      },
    ],
    previewTags: (v) => [
      v['level'] ? `Level ${v['level']}` : null,
      v['type'] as string | null,
      Number(v['recallCost']) > 0 ? `Recall: ${v['recallCost']}` : null,
    ].filter((t): t is string => !!t),
  },

  ancestry: {
    cardType: 'ancestry',
    sections: [
      {
        title: 'Basics',
        fields: BASICS_FIELDS_FULL,
      },
    ],
    previewTags: (v) => [
      v['isOfficial'] ? 'Official' : null,
    ].filter((t): t is string => !!t),
  },

  community: {
    cardType: 'community',
    sections: [
      {
        title: 'Basics',
        fields: BASICS_FIELDS_FULL,
      },
    ],
    previewTags: (v) => [
      v['isOfficial'] ? 'Official' : null,
    ].filter((t): t is string => !!t),
  },

  subclass: {
    cardType: 'subclass',
    sections: [
      {
        title: 'Basics',
        fields: BASICS_FIELDS_FULL,
      },
      {
        title: 'Subclass details',
        fields: [
          {
            name: 'level', label: 'Level', kind: 'enum', required: true, column: 1, options: [
              { value: 'FOUNDATION', label: 'Foundation' },
              { value: 'SPECIALIZATION', label: 'Specialization' },
              { value: 'MASTERY', label: 'Mastery' },
            ],
          },
          { name: 'associatedClassId', label: 'Class', kind: 'entity', lookup: 'classes', required: true, column: 2 },
          { name: 'subclassPathId', label: 'Subclass path', kind: 'entity', lookup: 'subclassPaths', required: true, dependsOn: 'associatedClassId', column: 'full' },
        ],
      },
    ],
    previewTags: (v) => [
      v['level'] as string | null,
    ].filter((t): t is string => !!t),
  },

  class: {
    cardType: 'class',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 100, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'startingClassItems', label: 'Starting class items', kind: 'textarea' as const, column: 'full' as const },
        ],
      },
      {
        title: 'Stats',
        fields: [
          { name: 'startingEvasion', label: 'Starting evasion', kind: 'number', required: true, positive: true, column: 1 },
          { name: 'startingHitPoints', label: 'Starting hit points', kind: 'number', required: true, positive: true, column: 2 },
        ],
      },
      {
        title: 'Relationships',
        fields: [
          { name: 'associatedDomainIds', label: 'Associated domains', kind: 'entityMulti', lookup: 'domains', column: 'full' },
          { name: 'hopeFeatureIds', label: 'Hope features', kind: 'entityMulti', lookup: 'hopeFeatures', column: 'full' },
          { name: 'classFeatureIds', label: 'Class features', kind: 'entityMulti', lookup: 'classFeatures', column: 'full' },
        ],
      },
    ],
    previewTags: (v) => [
      v['startingEvasion'] != null ? `Evasion: ${v['startingEvasion']}` : null,
      v['startingHitPoints'] != null ? `HP: ${v['startingHitPoints']}` : null,
    ].filter((t): t is string => !!t),
  },

  domain: {
    cardType: 'domain',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 'full' as const },
        ],
      },
    ],
    previewTags: () => [],
  },

  subclassPath: {
    cardType: 'subclassPath',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'associatedClassId', label: 'Class', kind: 'entity' as const, lookup: 'classes' as const, required: true, column: 2 as const },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'spellcastingTrait', label: 'Spellcasting trait', kind: 'enum', column: 1, options: TRAIT_OPTIONS },
          { name: 'associatedDomainIds', label: 'Associated domains', kind: 'entityMulti', lookup: 'domains', column: 'full' },
        ],
      },
    ],
    previewTags: (v) => [
      v['spellcastingTrait'] ? `Spellcasting: ${v['spellcastingTrait']}` : null,
    ].filter((t): t is string => !!t),
  },

  weapon: {
    cardType: 'weapon',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'tier', label: 'Tier', kind: 'number', required: true, positive: true, column: 1 },
          {
            name: 'trait', label: 'Trait', kind: 'enum', column: 2, options: TRAIT_OPTIONS,
          },
          {
            name: 'range', label: 'Range', kind: 'enum', column: 1, options: [
              { value: 'MELEE', label: 'Melee' },
              { value: 'VERY_CLOSE', label: 'Very close' },
              { value: 'CLOSE', label: 'Close' },
              { value: 'FAR', label: 'Far' },
              { value: 'VERY_FAR', label: 'Very far' },
            ],
          },
          {
            name: 'burden', label: 'Burden', kind: 'enum', column: 2, options: [
              { value: 'ONE_HANDED', label: 'One-handed' },
              { value: 'TWO_HANDED', label: 'Two-handed' },
            ],
          },
        ],
      },
    ],
    previewSubtitle: (v) => v['trait'] ? `${v['trait']} Weapon` : undefined,
    previewTags: (v) => [
      v['trait'] as string | null,
      v['range'] as string | null,
      v['burden'] as string | null,
    ].filter((t): t is string => !!t),
  },

  armor: {
    cardType: 'armor',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'tier', label: 'Tier', kind: 'number', required: true, positive: true, column: 1 },
          { name: 'baseScore', label: 'Base score', kind: 'number', required: true, min: 0, column: 2 },
          { name: 'baseMajorThreshold', label: 'Base major threshold', kind: 'number', required: true, min: 0, column: 1 },
          { name: 'baseSevereThreshold', label: 'Base severe threshold', kind: 'number', required: true, min: 0, column: 2 },
        ],
      },
    ],
    previewTags: (v) => [
      v['tier'] != null ? `Tier ${v['tier']}` : null,
    ].filter((t): t is string => !!t),
  },

  loot: {
    cardType: 'loot',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'tier', label: 'Tier', kind: 'number', positive: true, column: 1 },
          { name: 'cost', label: 'Cost', kind: 'text', column: 2 },
          { name: 'isConsumable', label: 'Consumable', kind: 'checkbox', column: 'full' },
        ],
      },
    ],
    previewTags: (v) => [
      v['tier'] != null ? `Tier ${v['tier']}` : null,
      v['isConsumable'] ? 'Consumable' : null,
    ].filter((t): t is string => !!t),
  },

  companion: {
    cardType: 'companion',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
        ],
      },
    ],
    previewTags: () => [],
  },
};
