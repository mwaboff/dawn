import { EntityFormSchema } from '../../../../shared/components/entity-form/entity-form.types';
import { FEATURE_TYPE_LABELS } from '../../../../shared/models/feature-type.model';

const FEATURE_TYPE_OPTIONS = (Object.keys(FEATURE_TYPE_LABELS) as (keyof typeof FEATURE_TYPE_LABELS)[])
  .map(value => ({ value, label: FEATURE_TYPE_LABELS[value] }));

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

export const CARD_EDIT_SCHEMAS: Record<string, EntityFormSchema> = {
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
      {
        title: 'Damage',
        fields: [
          {
            name: 'damageDiceCount',
            label: 'Dice count',
            kind: 'number',
            path: ['damage', 'diceCount'],
            helpText: 'Leave empty to use character proficiency.',
            column: 1,
          },
          {
            name: 'damageDiceType',
            label: 'Dice type',
            kind: 'enum',
            required: true,
            path: ['damage', 'diceType'],
            column: 2,
            options: [
              { value: 'D4', label: 'd4' },
              { value: 'D6', label: 'd6' },
              { value: 'D8', label: 'd8' },
              { value: 'D10', label: 'd10' },
              { value: 'D12', label: 'd12' },
            ],
          },
          {
            name: 'damageModifier',
            label: 'Modifier',
            kind: 'number',
            path: ['damage', 'modifier'],
            helpText: 'Flat bonus added to the damage roll. May be negative.',
            column: 1,
          },
          {
            name: 'damageDamageType',
            label: 'Damage type',
            kind: 'enum',
            required: true,
            path: ['damage', 'damageType'],
            column: 2,
            options: [
              { value: 'PHYSICAL', label: 'Physical' },
              { value: 'MAGIC', label: 'Magic' },
              { value: 'PHYSICAL_AND_MAGIC', label: 'Physical or Magic' },
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

  adversary: {
    cardType: 'adversary',
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
        title: 'Combat stats',
        fields: [
          { name: 'tier', label: 'Tier', kind: 'number', required: true, positive: true, column: 1 },
          {
            name: 'adversaryType', label: 'Type', kind: 'enum', required: true, column: 2, options: [
              { value: 'MINION', label: 'Minion' },
              { value: 'BRUISER', label: 'Bruiser' },
              { value: 'SKULK', label: 'Skulk' },
              { value: 'SOCIAL', label: 'Social' },
              { value: 'SOLO', label: 'Solo' },
              { value: 'LEADER', label: 'Leader' },
              { value: 'SUPPORT', label: 'Support' },
              { value: 'HORDE', label: 'Horde' },
              { value: 'STANDARD', label: 'Standard' },
            ],
          },
          { name: 'difficulty', label: 'Difficulty', kind: 'number', min: 0, column: 1 },
          { name: 'hitPointMax', label: 'Hit points', kind: 'number', min: 0, column: 2 },
          { name: 'stressMax', label: 'Stress', kind: 'number', min: 0, column: 1 },
          { name: 'evasion', label: 'Evasion', kind: 'number', min: 0, column: 2 },
        ],
      },
      {
        title: 'Thresholds',
        fields: [
          { name: 'majorThreshold', label: 'Major threshold', kind: 'number', min: 0, column: 1 },
          { name: 'severeThreshold', label: 'Severe threshold', kind: 'number', min: 0, column: 2 },
        ],
      },
      {
        title: 'Attack',
        fields: [
          { name: 'weaponName', label: 'Weapon name', kind: 'text', maxLength: 200, column: 1 },
          {
            name: 'attackRange', label: 'Range', kind: 'enum', column: 2, options: [
              { value: 'MELEE', label: 'Melee' },
              { value: 'VERY_CLOSE', label: 'Very close' },
              { value: 'CLOSE', label: 'Close' },
              { value: 'FAR', label: 'Far' },
              { value: 'VERY_FAR', label: 'Very far' },
            ],
          },
          { name: 'attackModifier', label: 'Attack modifier', kind: 'number', column: 1 },
          { name: 'damageNotation', label: 'Damage notation', kind: 'text', path: ['damage', 'notation'], column: 1 },
          {
            name: 'damageDamageType', label: 'Damage type', kind: 'enum', path: ['damage', 'damageType'], column: 2, options: [
              { value: 'PHYSICAL', label: 'Physical' },
              { value: 'MAGIC', label: 'Magic' },
              { value: 'PHYSICAL_AND_MAGIC', label: 'Physical or Magic' },
            ],
          },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'motivesAndTactics', label: 'Motives & tactics', kind: 'textarea', column: 'full' },
        ],
      },
    ],
    previewTags: (v) => [
      v['adversaryType'] as string | null,
      v['tier'] != null ? `Tier ${v['tier']}` : null,
      v['difficulty'] != null ? `Difficulty ${v['difficulty']}` : null,
    ].filter((t): t is string => !!t),
  },

  feature: {
    cardType: 'feature',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 200, column: 'full' },
          { name: 'description', label: 'Description', kind: 'textarea', column: 'full' },
          { name: 'expansionId', label: 'Expansion', kind: 'entity', lookup: 'expansions', required: true, allowCreate: true, column: 1 },
          { name: 'featureType', label: 'Feature type', kind: 'enum', required: true, column: 2, options: FEATURE_TYPE_OPTIONS },
        ],
      },
    ],
    previewTags: (v) => [
      FEATURE_TYPE_LABELS[v['featureType'] as keyof typeof FEATURE_TYPE_LABELS] ?? null,
    ].filter((t): t is string => !!t),
  },

  transformationCard: {
    cardType: 'transformationCard',
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

  environment: {
    cardType: 'environment',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'description', label: 'Description', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
          { name: 'isPublic', label: 'Publicly visible', kind: 'checkbox' as const, column: 2 as const },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'tier', label: 'Tier', kind: 'number', required: true, min: 1, helpText: 'Power tier, 1-4.', column: 1 },
          {
            name: 'environmentType', label: 'Type', kind: 'enum', required: true, column: 2, options: [
              { value: 'EXPLORATION', label: 'Exploration' },
              { value: 'TRAVERSAL', label: 'Traversal' },
              { value: 'EVENT', label: 'Event' },
              { value: 'SOCIAL', label: 'Social' },
            ],
          },
          { name: 'impulses', label: 'Impulses', kind: 'textarea', column: 'full' },
          { name: 'potentialAdversaries', label: 'Potential adversaries', kind: 'textarea', column: 'full' },
        ],
      },
      {
        // Difficulty is a XOR on the backend (Environment / CreateEnvironmentRequest):
        // exactly one of `difficulty` (numeric) or `difficultySpecial` (verbatim printed
        // text, e.g. "Special (see 'Relative Strength')") must be set. The schema format
        // has no way to express "exactly one of these two fields" or field-level XOR
        // validation, so both are left optional here; the backend re-validates the XOR
        // on save.
        title: 'Difficulty (set exactly one of the two fields below)',
        fields: [
          { name: 'difficulty', label: 'Difficulty (numeric)', kind: 'number', min: 1, column: 1 },
          { name: 'difficultySpecial', label: 'Difficulty (special text)', kind: 'text', maxLength: 255, column: 2 },
        ],
      },
    ],
    previewTags: (v) => [
      v['environmentType'] as string | null,
      v['tier'] != null ? `Tier ${v['tier']}` : null,
      v['difficulty'] != null ? `Difficulty ${v['difficulty']}` : (v['difficultySpecial'] ? `Difficulty: ${v['difficultySpecial']}` : null),
    ].filter((t): t is string => !!t),
  },

  martialStance: {
    cardType: 'martialStance',
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
          { name: 'tier', label: 'Tier', kind: 'number', required: true, min: 1, helpText: 'Gates which stances a character can know, 1-4.', column: 1 },
        ],
      },
    ],
    previewTags: (v) => [
      v['tier'] != null ? `Tier ${v['tier']}` : null,
    ].filter((t): t is string => !!t),
  },

  beastform: {
    cardType: 'beastform',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 200, column: 'full' as const },
          { name: 'example', label: 'Example', kind: 'textarea' as const, column: 'full' as const },
          { name: 'advantages', label: 'Advantages', kind: 'textarea' as const, column: 'full' as const },
          { name: 'expansionId', label: 'Expansion', kind: 'entity' as const, lookup: 'expansions' as const, required: true, allowCreate: true, column: 1 as const },
          { name: 'isOfficial', label: 'Official content', kind: 'checkbox' as const, column: 2 as const },
          { name: 'isPublic', label: 'Publicly visible', kind: 'checkbox' as const, column: 2 as const },
        ],
      },
      {
        title: 'Stats',
        fields: [
          { name: 'tier', label: 'Tier', kind: 'number', required: true, min: 1, helpText: 'Power tier, 1-4.', column: 1 },
          { name: 'evasion', label: 'Evasion', kind: 'number', column: 2 },
        ],
      },
      {
        title: 'Trait modifiers',
        fields: [
          { name: 'agilityModifier', label: 'Agility modifier', kind: 'number', column: 1 },
          { name: 'strengthModifier', label: 'Strength modifier', kind: 'number', column: 2 },
          { name: 'finesseModifier', label: 'Finesse modifier', kind: 'number', column: 1 },
          { name: 'instinctModifier', label: 'Instinct modifier', kind: 'number', column: 2 },
          { name: 'presenceModifier', label: 'Presence modifier', kind: 'number', column: 1 },
          { name: 'knowledgeModifier', label: 'Knowledge modifier', kind: 'number', column: 2 },
        ],
      },
      {
        title: 'Attack',
        fields: [
          {
            name: 'attackRange', label: 'Attack range', kind: 'enum', required: true, column: 1, options: [
              { value: 'MELEE', label: 'Melee' },
              { value: 'VERY_CLOSE', label: 'Very close' },
              { value: 'CLOSE', label: 'Close' },
              { value: 'FAR', label: 'Far' },
              { value: 'VERY_FAR', label: 'Very far' },
            ],
          },
          { name: 'attackTrait', label: 'Attack trait', kind: 'enum', required: true, column: 2, options: TRAIT_OPTIONS },
        ],
      },
      {
        title: 'Damage',
        fields: [
          {
            name: 'damageDiceCount',
            label: 'Dice count',
            kind: 'number',
            path: ['damage', 'diceCount'],
            helpText: 'Leave empty to use character proficiency.',
            column: 1,
          },
          {
            name: 'damageDiceType',
            label: 'Dice type',
            kind: 'enum',
            required: true,
            path: ['damage', 'diceType'],
            column: 2,
            options: [
              { value: 'D4', label: 'd4' },
              { value: 'D6', label: 'd6' },
              { value: 'D8', label: 'd8' },
              { value: 'D10', label: 'd10' },
              { value: 'D12', label: 'd12' },
              { value: 'D20', label: 'd20' },
            ],
          },
          {
            name: 'damageModifier',
            label: 'Modifier',
            kind: 'number',
            path: ['damage', 'modifier'],
            helpText: 'Flat bonus added to the damage roll. May be negative.',
            column: 1,
          },
          {
            name: 'damageDamageType',
            label: 'Damage type',
            kind: 'enum',
            required: true,
            path: ['damage', 'damageType'],
            column: 2,
            options: [
              { value: 'PHYSICAL', label: 'Physical' },
              { value: 'MAGIC', label: 'Magic' },
              { value: 'PHYSICAL_AND_MAGIC', label: 'Physical or Magic' },
            ],
          },
        ],
      },
    ],
    previewTags: (v) => [
      v['tier'] != null ? `Tier ${v['tier']}` : null,
      v['attackTrait'] as string | null,
      v['attackRange'] as string | null,
    ].filter((t): t is string => !!t),
  },

  condition: {
    cardType: 'condition',
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

  // An Expansion IS the expansion -- it has no expansionId of its own, so this
  // intentionally does not reuse BASICS_FIELDS_FULL (which includes an
  // expansionId lookup field).
  expansion: {
    cardType: 'expansion',
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'name', label: 'Name', kind: 'text' as const, required: true, maxLength: 255, column: 'full' as const },
          { name: 'isPublished', label: 'Published', kind: 'checkbox' as const, column: 'full' as const },
        ],
      },
    ],
    previewTags: (v) => [
      v['isPublished'] ? 'Published' : 'Unpublished',
    ],
  },
};
