import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { EntityFormField } from '../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { EntityMultiSelect } from '../../../../shared/components/entity-form/entity-multi-select/entity-multi-select';
import { LookupOption } from '../../../../shared/components/entity-form/entity-form.types';
import { FeatureEditor } from '../../../../shared/components/feature-editor/feature-editor';
import { FeatureInput } from '../../../../shared/models/feature-api.model';
import { ItemKind } from '../../item-routes';
import { ItemFormValue, toEditorFeatures } from '../../models/item-form-value.model';
import { itemAdvisories } from '../../utils/item-balance';
import { ArmorFields } from './components/armor-fields/armor-fields';
import { LootFields } from './components/loot-fields/loot-fields';
import { WeaponFields } from './components/weapon-fields/weapon-fields';
import {
  KIND_FIELD,
  NAME_FIELD,
  PUBLIC_FIELD,
  applyKindValidators,
  buildItemForm,
  readFormValue,
  seedForm,
  tierField,
} from './item-form.fields';

/**
 * The custom item editor, and nothing else: no HTTP, no router, no service that reaches the
 * network. Everything it needs arrives as an input and everything it produces leaves as an output,
 * so the same component serves the routed builder page and the character sheet's create-item
 * modal without either knowing about the other.
 */
@Component({
  selector: 'app-item-form',
  imports: [
    ReactiveFormsModule,
    EntityFormField,
    EntityMultiSelect,
    FeatureEditor,
    WeaponFields,
    ArmorFields,
    LootFields,
  ],
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemForm {
  private readonly destroyRef = inject(DestroyRef);

  readonly initialValue = input<ItemFormValue | null>(null);
  /** Pins the item to one kind and hides the picker -- used when the caller already knows. */
  readonly lockedKind = input<ItemKind | null>(null);
  readonly submitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly submitLabel = input<string>('Save Item');
  /** Campaigns the signed-in user may share with. Supplied by the caller; never fetched here. */
  readonly campaignOptions = input<LookupOption[]>([]);
  /** Whether to offer the public toggle. The server ignores it for non-moderators regardless. */
  readonly canSetPublic = input<boolean>(false);

  readonly submitted = output<ItemFormValue>();
  readonly cancelled = output<void>();

  private readonly featureEditor = viewChild(FeatureEditor);

  readonly form = buildItemForm(inject(FormBuilder));
  readonly kindField = KIND_FIELD;
  readonly nameField = NAME_FIELD;
  readonly publicField = PUBLIC_FIELD;

  /** True once a save has been attempted, which is when field errors start showing. */
  readonly attempted = signal(false);
  readonly editorFeatures = signal(toEditorFeatures([]));

  private readonly rawValue = toSignal(this.form.valueChanges as Observable<ItemFormValue>, {
    initialValue: this.form.getRawValue() as ItemFormValue,
  });

  readonly kind = computed<ItemKind>(() => this.lockedKind() ?? this.rawValue().kind);
  readonly tierField = computed(() => tierField(this.kind() === 'loot'));

  /** Power-level notes. Advisory only: these never disable the save button. */
  readonly advisories = computed(() => itemAdvisories({ ...this.rawValue(), kind: this.kind() }));

  readonly showThresholdOrderError = computed(() => {
    this.rawValue();
    return this.form.hasError('thresholdOrder')
      && (this.attempted() || this.form.controls['baseSevereThreshold'].dirty);
  });

  constructor() {
    effect(() => this.applyInitialValue(this.initialValue(), this.lockedKind()));

    this.form.controls['kind'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => applyKindValidators(this.form));
  }

  controlFor(name: string): AbstractControl {
    return this.form.controls[name];
  }

  campaignIdsControl(): FormControl<number[]> {
    return this.form.controls['campaignIds'] as FormControl<number[]>;
  }

  /**
   * Features are edited in memory and sent as a complete set, so a delete here just drops the row
   * -- no API call. Survivors are re-seeded from their *current* editor state so that
   * half-finished edits elsewhere in the list live through the rebuild.
   */
  onFeatureDeleted(id: number): void {
    const editor = this.featureEditor();
    if (!editor) return;
    const kept = editor.getEditableFeatures().filter(feature => feature.id !== id);
    this.editorFeatures.set(toEditorFeatures(kept.map(f => editor.buildNewFeaturePayload(f))));
    editor.resetDeleteState();
  }

  onSubmit(): void {
    this.attempted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(readFormValue(this.form, this.kind(), this.collectFeatures()));
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private collectFeatures(): FeatureInput[] {
    const editor = this.featureEditor();
    if (!editor) return [];
    return editor.getEditableFeatures().map(feature => editor.buildNewFeaturePayload(feature));
  }

  private applyInitialValue(initial: ItemFormValue | null, locked: ItemKind | null): void {
    seedForm(this.form, initial, locked);
    this.attempted.set(false);
    this.editorFeatures.set(toEditorFeatures(initial?.features ?? []));
  }
}
