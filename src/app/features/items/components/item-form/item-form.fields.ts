import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { FieldDef } from '../../../../shared/components/entity-form/entity-form.types';
import { positiveValidator } from '../../../../shared/components/entity-form/entity-form.utils';
import { FeatureInput } from '../../../../shared/models/feature-api.model';
import { ItemKind } from '../../item-routes';
import {
  DEFAULT_ITEM_FORM_VALUE,
  ITEM_TIERS,
  ItemFormValue,
  LOOT_RARITY_LABELS,
} from '../../models/item-form-value.model';

/**
 * The shape of the item form -- its controls, its hard validators, and the field definitions the
 * shared renderer draws them with. Split out from the component so `item-form.ts` is left with
 * behaviour only.
 */

export const MAX_NAME_LENGTH = 200;

export const NAME_FIELD: FieldDef = {
  name: 'name',
  label: 'Name',
  kind: 'text',
  required: true,
  maxLength: MAX_NAME_LENGTH,
};

export const PUBLIC_FIELD: FieldDef = {
  name: 'isPublic',
  label: 'Publish to everyone',
  kind: 'checkbox',
  helpText: 'Public items appear in the catalogue for every user.',
};

/** Loot uses the same four tiers as gear, but the books name them rather than numbering them. */
export function tierField(isLoot: boolean): FieldDef {
  return {
    name: 'tier',
    label: isLoot ? 'Rarity' : 'Tier',
    kind: 'enum',
    required: true,
    options: ITEM_TIERS.map(tier => ({
      value: String(tier),
      label: isLoot ? LOOT_RARITY_LABELS[tier] : `Tier ${tier}`,
    })),
  };
}

/** Severe damage has to sit at or beyond Major, or the two thresholds cannot both be read. */
export const thresholdOrderValidator: ValidatorFn = group => {
  const controls = (group as FormGroup).controls;
  if (controls['kind']?.value !== 'armor') return null;
  const major = Number(controls['baseMajorThreshold']?.value);
  const severe = Number(controls['baseSevereThreshold']?.value);
  if (!Number.isFinite(major) || !Number.isFinite(severe)) return null;
  return severe >= major ? null : { thresholdOrder: true };
};

/**
 * `Validators.required` counts "   " as present, but the mapper trims on the way to the wire, so a
 * blank name would be saved as an empty string. Reported as `required` so it reuses that message.
 */
export const nonBlankValidator: ValidatorFn = control =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/**
 * Hard validators that only bite while their own kind is selected -- otherwise a half-filled armor
 * threshold would block saving a weapon, with the offending field nowhere on screen.
 *
 * `required` is not redundant next to `min`/`positive`: those validators pass a null value, and a
 * cleared number input writes null, which `Number()` then turns into 0 on the way out. Without it
 * an emptied Armor Score saved as 0 and an emptied threshold saved as 0/0, under the floors below.
 */
const KIND_VALIDATORS: Record<ItemKind, Record<string, ValidatorFn[]>> = {
  weapon: { modifier: [Validators.required, Validators.min(0)] },
  armor: {
    baseScore: [Validators.required, Validators.min(1)],
    baseMajorThreshold: [Validators.required, positiveValidator],
    baseSevereThreshold: [Validators.required, positiveValidator],
  },
  loot: {},
};

const KIND_SCOPED_CONTROLS = ['modifier', 'baseScore', 'baseMajorThreshold', 'baseSevereThreshold'];

/**
 * One flat group across all three kinds, so switching kind keeps what was already typed. `tier` is
 * held as a string because that is what a `<select>` writes back; callers re-narrow it on the way
 * out.
 */
export function buildItemForm(fb: FormBuilder): FormGroup {
  const d = DEFAULT_ITEM_FORM_VALUE;
  const form = fb.group({
    kind: [d.kind],
    name: ['', [Validators.required, nonBlankValidator, Validators.maxLength(MAX_NAME_LENGTH)]],
    tier: [String(d.tier), [Validators.required, Validators.min(1), Validators.max(4)]],
    campaignIds: [[] as number[]],
    isPublic: [false],
    isPrimary: [d.isPrimary],
    trait: [d.trait],
    range: [d.range],
    burden: [d.burden],
    diceType: [d.diceType],
    modifier: [d.modifier],
    damageType: [d.damageType],
    baseScore: [d.baseScore],
    baseMajorThreshold: [d.baseMajorThreshold],
    baseSevereThreshold: [d.baseSevereThreshold],
    isConsumable: [d.isConsumable],
    description: [''],
  }, { validators: thresholdOrderValidator });

  applyKindValidators(form);
  return form;
}

/** Swaps the kind-scoped validators over to whichever kind is now selected. */
export function applyKindValidators(form: FormGroup): void {
  const active = KIND_VALIDATORS[form.controls['kind'].value as ItemKind] ?? {};
  for (const name of KIND_SCOPED_CONTROLS) {
    const control = form.controls[name];
    control.setValidators(active[name] ?? []);
    control.updateValueAndValidity({ emitEvent: false });
  }
  form.updateValueAndValidity({ emitEvent: false });
}

/** Fills the form from a value, defaulting anything the caller left out. */
export function seedForm(form: FormGroup, initial: ItemFormValue | null, locked: ItemKind | null): void {
  const value = { ...DEFAULT_ITEM_FORM_VALUE, ...(initial ?? {}) };
  form.reset({
    ...value,
    kind: locked ?? value.kind,
    tier: String(value.tier),
    description: value.description ?? '',
  });
  applyKindValidators(form);
}

/**
 * Reads the form back out as an `ItemFormValue`, narrowing the strings a `<select>` and a number
 * input hand back so that what leaves the component matches its declared contract.
 */
export function readFormValue(
  form: FormGroup,
  kind: ItemKind,
  features: FeatureInput[],
): ItemFormValue {
  const raw = form.getRawValue() as ItemFormValue;
  return {
    ...raw,
    kind,
    tier: Number(raw.tier),
    modifier: Number(raw.modifier),
    baseScore: Number(raw.baseScore),
    baseMajorThreshold: Number(raw.baseMajorThreshold),
    baseSevereThreshold: Number(raw.baseSevereThreshold),
    features,
  };
}
