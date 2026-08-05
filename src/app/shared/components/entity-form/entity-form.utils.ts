import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { EntityFormSchema, FieldDef } from './entity-form.types';

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

function getAllFields(schema: EntityFormSchema): FieldDef[] {
  return schema.sections.flatMap(section => section.fields);
}

function fieldPath(field: FieldDef): string[] {
  return field.path ?? [field.name];
}

function readPath(raw: Record<string, unknown>, path: string[]): unknown {
  let cursor: unknown = raw;
  for (const key of path) {
    if (cursor == null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function setPath(target: Record<string, unknown>, path: string[], value: unknown): void {
  let cursor = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const next = cursor[key];
    if (next == null || typeof next !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

function coerceNumberValue(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function buildFormFromSchema(
  schema: EntityFormSchema,
  raw: Record<string, unknown>,
  fb: FormBuilder,
): FormGroup {
  const controls: Record<string, FormControl> = {};

  for (const field of getAllFields(schema)) {
    const validators = buildValidators(field);
    const path = fieldPath(field);
    let initialValue: unknown;

    if (field.kind === 'entityMulti') {
      initialValue = readPath(raw, path) ?? [];
    } else {
      initialValue = readPath(raw, path) ?? null;
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
  schema: EntityFormSchema,
  form: FormGroup,
  extras?: Record<string, unknown>,
): Record<string, unknown> {
  const allFields = getAllFields(schema);

  const dirtyGroups = new Set<string>();
  for (const field of allFields) {
    const path = fieldPath(field);
    if (path.length > 1 && form.get(field.name)?.dirty) {
      dirtyGroups.add(path.slice(0, -1).join('.'));
    }
  }

  const payload: Record<string, unknown> = {};

  for (const field of allFields) {
    const path = fieldPath(field);
    const control = form.get(field.name);
    if (!control) continue;

    if (path.length === 1) {
      if (control.dirty) {
        payload[path[0]] = control.value;
      }
      continue;
    }

    const parentKey = path.slice(0, -1).join('.');
    if (!dirtyGroups.has(parentKey)) continue;

    const value = field.kind === 'number' ? coerceNumberValue(control.value) : control.value;
    setPath(payload, path, value);
  }

  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      payload[key] = value;
    }
  }

  return payload;
}

/**
 * Applies backend validation errors to the card-edit form, returning a banner message when
 * something couldn't be attached to a specific field control (or null when field-level errors
 * were fully applied and no separate banner is needed).
 *
 * The backend's only validation error DTO is `ValidationErrorResponse { fieldErrors: Record<
 * string, string> }` (from `GlobalExceptionHandler`) -- there is no `{ errors: [{field,
 * defaultMessage}] }` shape anywhere in this backend; the previous implementation of this
 * function parsed a shape nothing ever sends, so single-record validation failures always fell
 * through to the generic `err.message` fallback (which `ValidationErrorResponse` also doesn't
 * have) and ultimately the hardcoded "Save failed" banner in `card-edit.ts`, regardless of
 * which field actually failed.
 *
 * For a single-record `@Valid @RequestBody CreateXRequest` (not a `List<T>`), Spring's bean
 * validation reports the bare field name for top-level fields (e.g. "name", "featureType") and
 * a dot-joined path for nested/embedded fields (e.g. "damage.notation" for a weapon's embedded
 * DamageRoll) -- confirmed by reading `GlobalExceptionHandler.handleValidationErrors()`, which
 * uses `FieldError#getField()` directly with no index prefix (the "list[N]." / "[N]." prefixes
 * only appear for bulk `List<T>` bodies -- see `parseBulkFieldErrors` in `bulk-upload.utils.ts`).
 * That backend path doesn't necessarily match the form control's name, since some schema fields
 * declare an explicit `path` distinct from their control `name` (e.g. control `damageNotation`
 * maps to backend path `damage.notation`) -- so a `schema` is used, when available, to resolve
 * backend path -> control name correctly rather than assuming they're the same string.
 *
 * `schema` is optional because this function is also reused by `UserEdit` and
 * `SubclassPathEdit`'s per-level forms; `UserEdit` builds its `FormGroup` by hand with no
 * `CardSchema` at all (flat field names, no nested/embedded paths), so without a schema this
 * falls back to treating the backend key as the control name directly -- correct for a flat
 * form, and the same behavior as before for any single-level field even when a schema *is*
 * supplied.
 */
export function applyBackendErrors(
  form: FormGroup,
  errorResponse: unknown,
  schema?: EntityFormSchema,
): string | null {
  if (!errorResponse || typeof errorResponse !== 'object') {
    return null;
  }

  const err = errorResponse as Record<string, unknown>;

  const fieldErrors = err['fieldErrors'];
  if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
    const entries = Object.entries(fieldErrors as Record<string, string>);
    if (entries.length > 0) {
      const pathToFieldName = new Map<string, string>();
      if (schema) {
        for (const field of getAllFields(schema)) {
          pathToFieldName.set(fieldPath(field).join('.'), field.name);
        }
      }

      const unmatched: string[] = [];
      for (const [path, message] of entries) {
        const fieldName = pathToFieldName.get(path) ?? path;
        const control = form.get(fieldName);
        if (control) {
          control.setErrors({ backend: message ?? 'Invalid value' });
        } else {
          unmatched.push(`${path}: ${message}`);
        }
      }

      return unmatched.length > 0 ? unmatched.join('; ') : null;
    }
  }

  const message = err['message'];
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  return null;
}
