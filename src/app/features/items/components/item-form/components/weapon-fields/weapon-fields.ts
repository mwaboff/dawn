import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import { EntityFormField } from '../../../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { FieldDef } from '../../../../../../shared/components/entity-form/entity-form.types';
import {
  DAMAGE_TYPE_LABELS,
  DICE_TYPES,
  WEAPON_BURDEN_LABELS,
  WEAPON_RANGE_OPTIONS,
  WEAPON_TRAIT_LABELS,
} from '../../../../models/item-form-value.model';
import { DICE_COUNT_NOTE } from '../../../../utils/item-balance.utils';

function labelOptions(labels: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export const WEAPON_FIELDS: FieldDef[] = [
  {
    name: 'isPrimary',
    label: 'Primary weapon',
    kind: 'checkbox',
    helpText: 'Secondary weapons are the off-hand slot and hit for less.',
  },
  { name: 'trait', label: 'Trait', kind: 'enum', options: labelOptions(WEAPON_TRAIT_LABELS) },
  { name: 'range', label: 'Range', kind: 'enum', options: WEAPON_RANGE_OPTIONS },
  { name: 'burden', label: 'Burden', kind: 'enum', options: labelOptions(WEAPON_BURDEN_LABELS) },
  {
    name: 'diceType',
    label: 'Damage Die',
    kind: 'enum',
    options: DICE_TYPES.map(value => ({ value, label: value.toLowerCase() })),
    helpText: DICE_COUNT_NOTE,
  },
  { name: 'modifier', label: 'Damage Modifier', kind: 'number', min: 0 },
  { name: 'damageType', label: 'Damage Type', kind: 'enum', options: labelOptions(DAMAGE_TYPE_LABELS) },
];

/**
 * The weapon-only fields of the item form. Holds no state of its own -- it renders controls that
 * belong to the parent's group, and the host is `display: contents` so they land in the parent's
 * grid. There is deliberately no dice-*count* field: that number comes from Proficiency.
 */
@Component({
  selector: 'app-weapon-fields',
  imports: [EntityFormField],
  templateUrl: './weapon-fields.html',
  styleUrl: './weapon-fields.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponFields {
  readonly form = input.required<FormGroup>();
  readonly submitted = input<boolean>(false);

  readonly fields = WEAPON_FIELDS;

  controlFor(name: string): AbstractControl {
    return this.form().controls[name];
  }
}
