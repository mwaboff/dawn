import { EntityFormSchema } from '../../../../../../shared/components/entity-form/entity-form.types';

/** `Range` enum minus `OUT_OF_RANGE` -- not a valid attack range for a companion. */
const COMPANION_RANGE_OPTIONS = [
  { value: 'MELEE', label: 'Melee' },
  { value: 'VERY_CLOSE', label: 'Very Close' },
  { value: 'CLOSE', label: 'Close' },
  { value: 'FAR', label: 'Far' },
  { value: 'VERY_FAR', label: 'Very Far' },
];

/** The Vicious damage-die ladder tops out at D12, and a companion never starts below D6. */
const COMPANION_DICE_OPTIONS = [
  { value: 'D6', label: 'd6' },
  { value: 'D8', label: 'd8' },
  { value: 'D10', label: 'd10' },
  { value: 'D12', label: 'd12' },
];

/**
 * No `damageType` field: it defaults to Physical server-side and is read-only on the wire --
 * absent from both `CreateCompanionRequest` and `UpdateCompanionRequest` -- so it cannot be set
 * from this form despite being listed in the companions plan §6.2. See `companion-form-modal.ts`.
 *
 * No `previewTags`/`previewSubtitle`: this schema never backs a card preview.
 */
export const COMPANION_FORM_SCHEMA: EntityFormSchema = {
  cardType: 'companion',
  sections: [
    {
      title: 'Basics',
      fields: [
        { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 200, column: 'full' },
        { name: 'description', label: 'Description', kind: 'textarea', column: 'full' },
      ],
    },
    {
      title: 'Attack & Stress',
      fields: [
        { name: 'evasion', label: 'Base Evasion', kind: 'number', min: 0, column: 1 },
        { name: 'stressMax', label: 'Base Stress Max', kind: 'number', min: 1, column: 2 },
        { name: 'attackName', label: 'Attack Name', kind: 'text', required: true, maxLength: 200, column: 'full' },
        { name: 'attackRange', label: 'Attack Range', kind: 'enum', required: true, column: 1, options: COMPANION_RANGE_OPTIONS },
        { name: 'damageDice', label: 'Damage Die', kind: 'enum', required: true, column: 2, options: COMPANION_DICE_OPTIONS },
      ],
    },
  ],
};

/** Printed starting values -- the same defaults `CreateCompanionRequest` falls back to
 * server-side when a field is omitted, made explicit here so the create form shows them. */
export const COMPANION_FORM_DEFAULTS: Record<string, unknown> = {
  name: '',
  description: '',
  evasion: 10,
  attackName: '',
  attackRange: 'MELEE',
  damageDice: 'D6',
  stressMax: 3,
};
