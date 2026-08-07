import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import { EntityFormField } from '../../../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { FieldDef } from '../../../../../../shared/components/entity-form/entity-form.types';

export const ARMOR_FIELDS: FieldDef[] = [
  { name: 'baseScore', label: 'Base Armor Score', kind: 'number', min: 1 },
  { name: 'baseMajorThreshold', label: 'Major Threshold', kind: 'number', positive: true },
  { name: 'baseSevereThreshold', label: 'Severe Threshold', kind: 'number', positive: true },
];

/**
 * The armor-only fields of the item form. Holds no state of its own -- it renders controls that
 * belong to the parent's group, and the host is `display: contents` so they land in the parent's
 * grid.
 */
@Component({
  selector: 'app-armor-fields',
  imports: [EntityFormField],
  templateUrl: './armor-fields.html',
  styleUrl: './armor-fields.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmorFields {
  readonly form = input.required<FormGroup>();
  readonly submitted = input<boolean>(false);

  readonly fields = ARMOR_FIELDS;

  controlFor(name: string): AbstractControl {
    return this.form().controls[name];
  }
}
