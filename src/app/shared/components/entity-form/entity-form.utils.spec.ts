import { FormBuilder } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  URL_REGEX,
  applyBackendErrors,
  buildFormFromSchema,
  buildPayloadFromSchema,
  positiveValidator,
} from './entity-form.utils';
import { EntityFormSchema } from './entity-form.types';
import { FormControl } from '@angular/forms';

const domainCardSchema: EntityFormSchema = {
  cardType: 'domainCard',
  sections: [
    {
      title: 'Basics',
      fields: [
        { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 200, column: 'full' },
        { name: 'description', label: 'Description', kind: 'textarea', column: 'full' },
        { name: 'backgroundImageUrl', label: 'Background image URL', kind: 'url', maxLength: 500, column: 'full' },
      ],
    },
    {
      title: 'Domain card details',
      fields: [
        { name: 'associatedDomainId', label: 'Domain', kind: 'entity', lookup: 'domains', required: true, column: 1 },
        { name: 'level', label: 'Level', kind: 'number', required: true, positive: true, column: 2 },
        { name: 'recallCost', label: 'Recall cost', kind: 'number', required: true, min: 0, column: 1 },
        { name: 'type', label: 'Type', kind: 'enum', required: true, column: 2, options: [
          { value: 'SPELL', label: 'Spell' },
          { value: 'GRIMOIRE', label: 'Grimoire' },
        ]},
        { name: 'domainFeatureIds', label: 'Features', kind: 'entityMulti', lookup: 'domainFeatures', column: 'full' },
      ],
    },
  ],
  previewTags: (v) => [
    v['level'] ? `Level ${v['level']}` : null,
    v['type'] as string,
    Number(v['recallCost']) > 0 ? `Recall: ${v['recallCost']}` : null,
  ].filter((t): t is string => !!t),
  previewSubtitle: (v) => v['type'] ? `${v['type']} card` : undefined,
};

const rawCard: Record<string, unknown> = {
  id: 42,
  name: 'Test Spell',
  description: 'A powerful spell',
  expansionId: 1,
  level: 3,
  recallCost: 2,
  type: 'SPELL',
  associatedDomainId: 7,
  cardType: 'domain',
};

describe('buildFormFromSchema', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('creates a FormGroup with controls for all schema fields', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('backgroundImageUrl')).toBeTruthy();
    expect(form.get('level')).toBeTruthy();
    expect(form.get('recallCost')).toBeTruthy();
    expect(form.get('type')).toBeTruthy();
    expect(form.get('associatedDomainId')).toBeTruthy();
    expect(form.get('domainFeatureIds')).toBeTruthy();
  });

  it('populates initial values from raw card', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    expect(form.get('name')?.value).toBe('Test Spell');
    expect(form.get('level')?.value).toBe(3);
    expect(form.get('type')?.value).toBe('SPELL');
  });

  it('defaults entityMulti fields to [] when raw value is missing', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    expect(form.get('domainFeatureIds')?.value).toEqual([]);
  });

  it('attaches required validator to required fields', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const nameControl = form.get('name')!;
    nameControl.setValue('');
    expect(nameControl.hasError('required')).toBe(true);
  });

  it('attaches maxLength validator', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const nameControl = form.get('name')!;
    nameControl.setValue('x'.repeat(201));
    expect(nameControl.hasError('maxlength')).toBe(true);
  });

  it('attaches min validator', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const recallControl = form.get('recallCost')!;
    recallControl.setValue(-1);
    expect(recallControl.hasError('min')).toBe(true);
  });

  it('attaches positive validator', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const levelControl = form.get('level')!;
    levelControl.setValue(0);
    expect(levelControl.hasError('positive')).toBe(true);
  });

  it('attaches url pattern validator to url fields', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const urlControl = form.get('backgroundImageUrl')!;
    urlControl.setValue('not-a-url');
    expect(urlControl.hasError('pattern')).toBe(true);
  });

  it('url validator passes for valid http url', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const urlControl = form.get('backgroundImageUrl')!;
    urlControl.setValue('https://example.com/image.jpg');
    expect(urlControl.hasError('pattern')).toBe(false);
  });
});

describe('buildPayloadFromSchema', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('returns empty object when no controls are dirty', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const payload = buildPayloadFromSchema(domainCardSchema, form);
    expect(payload).toEqual({});
  });

  it('returns only dirty controls', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    form.get('name')!.setValue('Updated Name');
    form.get('name')!.markAsDirty();
    const payload = buildPayloadFromSchema(domainCardSchema, form);
    expect(Object.keys(payload)).toEqual(['name']);
    expect(payload['name']).toBe('Updated Name');
  });

  it('includes multiple dirty controls', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    form.get('name')!.setValue('New Name');
    form.get('name')!.markAsDirty();
    form.get('level')!.setValue(5);
    form.get('level')!.markAsDirty();
    const payload = buildPayloadFromSchema(domainCardSchema, form);
    expect(Object.keys(payload).sort()).toEqual(['level', 'name']);
  });

  it('does not include pristine controls in payload', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    form.get('name')!.setValue('Dirty Name');
    form.get('name')!.markAsDirty();
    const payload = buildPayloadFromSchema(domainCardSchema, form);
    expect('description' in payload).toBe(false);
    expect('type' in payload).toBe(false);
  });
});

const weaponSchema: EntityFormSchema = {
  cardType: 'weapon',
  sections: [
    {
      title: 'Basics',
      fields: [
        { name: 'name', label: 'Name', kind: 'text', required: true, column: 'full' },
        { name: 'tier', label: 'Tier', kind: 'number', required: true, positive: true, column: 1 },
      ],
    },
    {
      title: 'Damage',
      fields: [
        { name: 'damageDiceCount', label: 'Dice count', kind: 'number', path: ['damage', 'diceCount'], column: 1 },
        { name: 'damageDiceType', label: 'Dice type', kind: 'enum', required: true, path: ['damage', 'diceType'], column: 2, options: [
          { value: 'D6', label: 'd6' },
          { value: 'D10', label: 'd10' },
        ]},
        { name: 'damageModifier', label: 'Modifier', kind: 'number', path: ['damage', 'modifier'], column: 1 },
        { name: 'damageDamageType', label: 'Damage type', kind: 'enum', required: true, path: ['damage', 'damageType'], column: 2, options: [
          { value: 'PHYSICAL', label: 'Physical' },
          { value: 'MAGIC', label: 'Magic' },
        ]},
      ],
    },
  ],
  previewTags: () => [],
};

const rawWeapon: Record<string, unknown> = {
  id: 7,
  name: 'Longsword',
  expansionId: 1,
  tier: 1,
  damage: {
    diceCount: 2,
    diceType: 'D10',
    modifier: 3,
    damageType: 'PHYSICAL',
    notation: '2d10+3 phy',
  },
  cardType: 'weapon',
};

describe('nested path support', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('reads nested damage values from raw into flat form controls', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    expect(form.get('damageDiceCount')?.value).toBe(2);
    expect(form.get('damageDiceType')?.value).toBe('D10');
    expect(form.get('damageModifier')?.value).toBe(3);
    expect(form.get('damageDamageType')?.value).toBe('PHYSICAL');
  });

  it('defaults nested values to empty string when raw.damage is missing', () => {
    const bareWeapon: Record<string, unknown> = { id: 1, name: 'Bare', expansionId: 1, cardType: 'weapon' };
    const form = buildFormFromSchema(weaponSchema, bareWeapon, fb);
    expect(form.get('damageDiceCount')?.value).toBe('');
    expect(form.get('damageDiceType')?.value).toBe('');
  });

  it('excludes the nested group from payload when no damage subfield is dirty', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    form.get('name')!.setValue('Renamed');
    form.get('name')!.markAsDirty();
    const payload = buildPayloadFromSchema(weaponSchema, form);
    expect(payload).toEqual({ name: 'Renamed' });
    expect('damage' in payload).toBe(false);
  });

  it('includes the full damage object when any subfield is dirty', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    form.get('damageModifier')!.setValue(5);
    form.get('damageModifier')!.markAsDirty();
    const payload = buildPayloadFromSchema(weaponSchema, form);
    expect(payload['damage']).toEqual({
      diceCount: 2,
      diceType: 'D10',
      modifier: 5,
      damageType: 'PHYSICAL',
    });
  });

  it('coerces empty diceCount to null in payload (use proficiency)', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    form.get('damageDiceCount')!.setValue('');
    form.get('damageDiceCount')!.markAsDirty();
    const payload = buildPayloadFromSchema(weaponSchema, form);
    expect((payload['damage'] as Record<string, unknown>)['diceCount']).toBeNull();
  });

  it('coerces empty modifier to null in payload', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    form.get('damageModifier')!.setValue('');
    form.get('damageModifier')!.markAsDirty();
    const payload = buildPayloadFromSchema(weaponSchema, form);
    expect((payload['damage'] as Record<string, unknown>)['modifier']).toBeNull();
  });

  it('preserves negative modifier values in payload', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    form.get('damageModifier')!.setValue(-2);
    form.get('damageModifier')!.markAsDirty();
    const payload = buildPayloadFromSchema(weaponSchema, form);
    expect((payload['damage'] as Record<string, unknown>)['modifier']).toBe(-2);
  });

  it('leaves existing flat field behavior unchanged when damage is dirty', () => {
    const form = buildFormFromSchema(weaponSchema, rawWeapon, fb);
    form.get('name')!.setValue('Greatsword');
    form.get('name')!.markAsDirty();
    form.get('damageDiceType')!.setValue('D6');
    form.get('damageDiceType')!.markAsDirty();
    const payload = buildPayloadFromSchema(weaponSchema, form);
    expect(payload['name']).toBe('Greatsword');
    expect((payload['damage'] as Record<string, unknown>)['diceType']).toBe('D6');
  });
});

// Mirrors the shape of a real schema field whose backend path differs from its control name
// (e.g. weapon.damageNotation -> backend path "damage.notation"), so path-to-control-name
// resolution is exercised the same way it would be for a real nested/embedded field.
const pathDifferingSchema: EntityFormSchema = {
  cardType: 'weapon',
  sections: [
    {
      title: 'Basics',
      fields: [
        { name: 'name', label: 'Name', kind: 'text', required: true, column: 'full' },
        { name: 'damageNotation', label: 'Damage notation', kind: 'text', path: ['damage', 'notation'], column: 1 },
        { name: 'damageDamageType', label: 'Damage type', kind: 'enum', path: ['damage', 'damageType'], column: 2, options: [] },
      ],
    },
  ],
  previewTags: () => [],
};

describe('applyBackendErrors', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  // The backend's only validation error DTO is ValidationErrorResponse.fieldErrors, a
  // Record<string, string> keyed by bare field name (single-record @Valid, confirmed by
  // reading GlobalExceptionHandler.handleValidationErrors -- no "{errors: [...]}" shape is
  // ever sent). These tests exercise that real shape.

  it('sets backend error on the named field (bare field name) and returns null', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { fieldErrors: { name: 'Name is too long' } };
    const result = applyBackendErrors(form, errorResponse, domainCardSchema);
    expect(result).toBeNull();
    expect(form.get('name')?.getError('backend')).toBe('Name is too long');
  });

  it('returns null when all field errors resolve to a control', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { fieldErrors: { name: 'Required', level: 'Must be positive' } };
    const result = applyBackendErrors(form, errorResponse, domainCardSchema);
    expect(result).toBeNull();
    expect(form.get('name')?.getError('backend')).toBe('Required');
    expect(form.get('level')?.getError('backend')).toBe('Must be positive');
  });

  it('resolves a dot-joined backend path to the control whose schema field declares that path', () => {
    const rawWeapon: Record<string, unknown> = {
      id: 1, name: 'Shortsword', expansionId: 1, cardType: 'weapon',
      damage: { notation: '2d6', damageType: 'PHYSICAL' },
    };
    const form = buildFormFromSchema(pathDifferingSchema, rawWeapon, fb);
    const errorResponse = { fieldErrors: { 'damage.notation': 'Invalid damage notation' } };
    const result = applyBackendErrors(form, errorResponse, pathDifferingSchema);
    expect(result).toBeNull();
    // The control is named "damageNotation", not "damage.notation" -- resolution must go
    // through the schema's declared path, not assume the backend key matches the control name.
    expect(form.get('damageNotation')?.getError('backend')).toBe('Invalid damage notation');
  });

  it('returns a banner listing unmatched field errors when a key resolves to no control', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { fieldErrors: { requests: 'must not be empty' } };
    const result = applyBackendErrors(form, errorResponse, domainCardSchema);
    expect(result).toContain('requests');
    expect(result).toContain('must not be empty');
  });

  it('returns banner message when error has top-level message only (non-validation ErrorResponse)', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { message: 'Internal server error' };
    const result = applyBackendErrors(form, errorResponse, domainCardSchema);
    expect(result).toBe('Internal server error');
  });

  it('returns null for null error response', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const result = applyBackendErrors(form, null, domainCardSchema);
    expect(result).toBeNull();
  });

  it('does not throw when fieldErrors is an empty object', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { fieldErrors: {} };
    expect(() => applyBackendErrors(form, errorResponse, domainCardSchema)).not.toThrow();
    expect(applyBackendErrors(form, errorResponse, domainCardSchema)).toBeNull();
  });

  it('ignores the legacy {errors: [...]} shape entirely, since the backend never sends it', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { errors: [{ field: 'name', defaultMessage: 'Name is too long' }] };
    const result = applyBackendErrors(form, errorResponse, domainCardSchema);
    // No fieldErrors key present, so this falls through to the message fallback (also absent)
    // and returns null -- it must NOT set a backend error from the legacy shape.
    expect(result).toBeNull();
    expect(form.get('name')?.hasError('backend')).toBe(false);
  });
});

describe('positiveValidator', () => {
  it('returns null for positive integer', () => {
    const control = new FormControl(5);
    expect(positiveValidator(control)).toBeNull();
  });

  it('returns error for zero', () => {
    const control = new FormControl(0);
    expect(positiveValidator(control)).toEqual({ positive: true });
  });

  it('returns error for negative number', () => {
    const control = new FormControl(-3);
    expect(positiveValidator(control)).toEqual({ positive: true });
  });

  it('returns error for non-integer (float)', () => {
    const control = new FormControl(1.5);
    expect(positiveValidator(control)).toEqual({ positive: true });
  });

  it('returns null for null value (optional field)', () => {
    const control = new FormControl(null);
    expect(positiveValidator(control)).toBeNull();
  });

  it('returns null for undefined value', () => {
    const control = new FormControl(undefined);
    expect(positiveValidator(control)).toBeNull();
  });

  it('returns null for empty string', () => {
    const control = new FormControl('');
    expect(positiveValidator(control)).toBeNull();
  });
});

describe('URL_REGEX', () => {
  it('matches http urls', () => {
    expect(URL_REGEX.test('http://example.com')).toBe(true);
  });

  it('matches https urls', () => {
    expect(URL_REGEX.test('https://example.com/image.png')).toBe(true);
  });

  it('rejects non-url strings', () => {
    expect(URL_REGEX.test('not-a-url')).toBe(false);
  });

  it('rejects ftp urls', () => {
    expect(URL_REGEX.test('ftp://example.com')).toBe(false);
  });
});
