import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldDef, EnumField, EntityField } from '../../schema/card-edit-schema.types';
import { EntitySelect } from '../entity-select/entity-select';
import { EntityMultiSelect } from '../entity-multi-select/entity-multi-select';

const FIELD_ERROR_MESSAGES: Record<string, (field: FieldDef, err: unknown) => string> = {
  required: (f) => `${f.label} is required.`,
  maxlength: (f, err) => `${f.label} must be ${(err as { requiredLength: number }).requiredLength} characters or fewer.`,
  min: (f, err) => `${f.label} must be at least ${(err as { min: number }).min}.`,
  pattern: (f) => `${f.label} must be a valid URL.`,
  positive: (f) => `${f.label} must be greater than 0.`,
  backend: (_f, err) => String(err),
};

const ERROR_PRIORITY = ['required', 'maxlength', 'min', 'pattern', 'positive', 'backend'];

@Component({
  selector: 'app-card-edit-field',
  imports: [ReactiveFormsModule, EntitySelect, EntityMultiSelect],
  templateUrl: './card-edit-field.html',
  styleUrl: './card-edit-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditField {
  readonly field = input.required<FieldDef>();
  readonly control = input.required<AbstractControl>();
  readonly submitted = input<boolean>(false);
  readonly dependsOnControl = input<FormControl<number | null> | undefined>(undefined);

  readonly createRequested = output<void>();

  readonly columnClass = computed(() => {
    const col = this.field().column;
    if (col === 1) return 'form-group--col-1';
    if (col === 2) return 'form-group--col-2';
    if (col === 'full') return 'form-group--full';
    return '';
  });

  readonly showError = computed(() => {
    const ctrl = this.control();
    return ctrl.invalid && (ctrl.dirty || ctrl.touched || this.submitted());
  });

  readonly errorMessage = computed(() => {
    const ctrl = this.control();
    const errors = ctrl.errors;
    if (!errors) return '';
    for (const key of ERROR_PRIORITY) {
      if (key in errors) {
        return FIELD_ERROR_MESSAGES[key](this.field(), errors[key]);
      }
    }
    return '';
  });

  readonly enumOptions = computed(() => {
    const f = this.field();
    if (f.kind === 'enum') return (f as EnumField).options;
    return [];
  });

  readonly entityLookup = computed(() => {
    const f = this.field();
    if (f.kind === 'entity' || f.kind === 'entityMulti') return (f as EntityField).lookup;
    return 'expansions' as const;
  });

  readonly entityAllowCreate = computed(() => {
    const f = this.field();
    if (f.kind === 'entity') return (f as EntityField).allowCreate ?? false;
    return false;
  });

  asFormControl(): FormControl {
    return this.control() as FormControl;
  }

  asFormArrayControl(): FormControl<number[]> {
    return this.control() as FormControl<number[]>;
  }

  onCreateRequested(): void {
    this.createRequested.emit();
  }
}
