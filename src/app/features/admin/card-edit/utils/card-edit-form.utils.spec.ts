import { FormBuilder } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  URL_REGEX,
  applyBackendErrors,
  buildFormFromSchema,
  buildPayloadFromSchema,
  buildPreviewCard,
  positiveValidator,
} from './card-edit-form.utils';
import { CardSchema } from '../schema/card-edit-schema.types';
import { RawCardResponse } from '../../models/admin-api.model';
import { FormControl } from '@angular/forms';

const domainCardSchema: CardSchema = {
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

const rawCard: RawCardResponse = {
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

describe('applyBackendErrors', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('sets backend error on the named field and returns null', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = {
      errors: [{ field: 'name', defaultMessage: 'Name is too long' }],
    };
    const result = applyBackendErrors(form, errorResponse);
    expect(result).toBeNull();
    expect(form.get('name')?.getError('backend')).toBe('Name is too long');
  });

  it('returns null when all errors are field-scoped', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = {
      errors: [
        { field: 'name', defaultMessage: 'Required' },
        { field: 'level', defaultMessage: 'Must be positive' },
      ],
    };
    const result = applyBackendErrors(form, errorResponse);
    expect(result).toBeNull();
    expect(form.get('name')?.getError('backend')).toBe('Required');
    expect(form.get('level')?.getError('backend')).toBe('Must be positive');
  });

  it('returns banner message when error has top-level message only', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = { message: 'Internal server error' };
    const result = applyBackendErrors(form, errorResponse);
    expect(result).toBe('Internal server error');
  });

  it('returns null for null error response', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const result = applyBackendErrors(form, null);
    expect(result).toBeNull();
  });

  it('ignores field error if field does not exist on form', () => {
    const form = buildFormFromSchema(domainCardSchema, rawCard, fb);
    const errorResponse = {
      errors: [{ field: 'nonExistentField', defaultMessage: 'Error' }],
    };
    expect(() => applyBackendErrors(form, errorResponse)).not.toThrow();
  });
});

describe('buildPreviewCard', () => {
  it('produces expected CardData shape for domainCard', () => {
    const formValue: Record<string, unknown> = {
      name: 'Fireball',
      description: 'Deals fire damage',
      level: 3,
      recallCost: 2,
      type: 'SPELL',
    };
    const features = [
      { id: 1, name: 'Burn', description: 'Applies burning', subtitle: 'PASSIVE', tags: ['FIRE'] },
    ];
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, features);
    expect(result.id).toBe(42);
    expect(result.name).toBe('Fireball');
    expect(result.description).toBe('Deals fire damage');
    expect(result.cardType).toBe('domain');
    expect(result.tags).toContain('Level 3');
    expect(result.tags).toContain('SPELL');
    expect(result.tags).toContain('Recall: 2');
    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Burn');
  });

  it('uses schema.previewSubtitle when defined', () => {
    const formValue: Record<string, unknown> = { name: 'Fireball', type: 'GRIMOIRE' };
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, []);
    expect(result.subtitle).toBe('GRIMOIRE card');
  });

  it('returns undefined features when feature list is empty', () => {
    const formValue: Record<string, unknown> = { name: 'Test', type: 'SPELL', level: 1, recallCost: 0 };
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, []);
    expect(result.features).toBeUndefined();
  });

  it('uses raw.id for the card id', () => {
    const formValue: Record<string, unknown> = { name: 'Test' };
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, []);
    expect(result.id).toBe(rawCard.id);
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
