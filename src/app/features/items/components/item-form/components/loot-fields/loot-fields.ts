import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import { EntityFormField } from '../../../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { FieldDef } from '../../../../../../shared/components/entity-form/entity-form.types';

export const LOOT_FIELDS: FieldDef[] = [
  {
    name: 'isConsumable',
    label: 'Consumable',
    kind: 'checkbox',
    helpText: 'Consumables are spent when used.',
  },
  { name: 'description', label: 'Description', kind: 'textarea' },
];

/**
 * The loot-only fields of the item form. Holds no state of its own -- it renders controls that
 * belong to the parent's group, and the host is `display: contents` so they land in the parent's
 * grid.
 */
@Component({
  selector: 'app-loot-fields',
  imports: [EntityFormField],
  templateUrl: './loot-fields.html',
  styleUrl: './loot-fields.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LootFields {
  readonly form = input.required<FormGroup>();
  readonly submitted = input<boolean>(false);

  readonly fields = LOOT_FIELDS;

  controlFor(name: string): AbstractControl {
    return this.form().controls[name];
  }
}
