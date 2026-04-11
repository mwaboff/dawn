import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { RawCardResponse } from '../../models/admin-api.model';
import { CardSchema, FieldDef } from '../schema/card-edit-schema.types';

export const URL_REGEX = /^(https?:\/\/.+)$/;

export const positiveValidator: ValidatorFn = (control) => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return { positive: true };
  }
  return null;
};

function buildValidators(field: FieldDef): ValidatorFn[] {
  const validators: ValidatorFn[] = [];

  if (field.required) {
    validators.push(Validators.required);
  }
  if (field.maxLength != null) {
    validators.push(Validators.maxLength(field.maxLength));
  }
  if (field.min != null) {
    validators.push(Validators.min(field.min));
  }
  if (field.positive) {
    validators.push(positiveValidator);
  }
  if (field.kind === 'url') {
    validators.push(Validators.pattern(URL_REGEX));
  }

  return validators;
}

function getAllFields(schema: CardSchema): FieldDef[] {
  return schema.sections.flatMap(section => section.fields);
}

export function buildFormFromSchema(
  schema: CardSchema,
  raw: RawCardResponse,
  fb: FormBuilder,
): FormGroup {
  const controls: Record<string, FormControl> = {};

  for (const field of getAllFields(schema)) {
    const validators = buildValidators(field);
    let initialValue: unknown;

    if (field.kind === 'entityMulti') {
      initialValue = raw[field.name] ?? [];
    } else {
      initialValue = raw[field.name] ?? null;
    }

    if (field.kind === 'entity' || field.kind === 'entityMulti') {
      controls[field.name] = new FormControl(initialValue, validators);
    } else {
      controls[field.name] = fb.nonNullable.control(initialValue ?? '', validators);
    }
  }

  return fb.group(controls);
}

export function buildPayloadFromSchema(
  schema: CardSchema,
  form: FormGroup,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of getAllFields(schema)) {
    const control = form.get(field.name);
    if (control?.dirty) {
      payload[field.name] = control.value;
    }
  }

  return payload;
}

export function applyBackendErrors(
  form: FormGroup,
  errorResponse: unknown,
): string | null {
  if (!errorResponse || typeof errorResponse !== 'object') {
    return null;
  }

  const err = errorResponse as Record<string, unknown>;

  const errors = err['errors'];
  if (Array.isArray(errors) && errors.length > 0) {
    for (const fieldError of errors) {
      if (fieldError && typeof fieldError === 'object') {
        const fe = fieldError as Record<string, unknown>;
        const field = fe['field'] as string | undefined;
        const message = fe['defaultMessage'] as string | undefined;
        if (field) {
          form.get(field)?.setErrors({ backend: message ?? 'Invalid value' });
        }
      }
    }
    return null;
  }

  const message = err['message'];
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  return null;
}

export function buildPreviewCard(
  schema: CardSchema,
  formValue: Record<string, unknown>,
  raw: RawCardResponse,
  features: unknown[],
): CardData {
  const cardFeatures = (features as Record<string, unknown>[]).map(f => ({
    id: f['id'] as number | undefined,
    name: (f['name'] as string) ?? '',
    description: (f['description'] as string) ?? '',
    subtitle: (f['subtitle'] as string | undefined),
    tags: (f['tags'] as string[] | undefined),
  }));

  return {
    id: raw.id,
    name: (formValue['name'] as string) ?? '',
    description: (formValue['description'] as string) ?? '',
    cardType: raw['cardType'] as CardData['cardType'] ?? 'domain',
    subtitle: schema.previewSubtitle?.(formValue),
    tags: schema.previewTags(formValue),
    features: cardFeatures.length > 0 ? cardFeatures : undefined,
    metadata: {},
  };
}
