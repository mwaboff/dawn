import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
  effect,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup, AbstractControl, FormControl } from '@angular/forms';
import { RawCardResponse } from '../../../features/admin/models/admin-api.model';
import { CardData, CardFeature } from '../daggerheart-card/daggerheart-card.model';
import { CARD_EDIT_SCHEMAS } from './schema/card-edit-schema';
import { CardSchema, EntityField, FieldDef } from './schema/card-edit-schema.types';
import { buildFormFromSchema, buildPayloadFromSchema, buildPreviewCard } from './utils/card-edit-form.utils';
import { AdminLookupService } from './services/admin-lookup.service';
import { CardEditField } from './components/card-edit-field/card-edit-field';
import { CardEditPreview } from './components/card-edit-preview/card-edit-preview';
import { AddExpansionDialog } from './components/add-expansion-dialog/add-expansion-dialog';
import { ExpansionOption } from '../../models/expansion-api.model';

const FALLBACK_SCHEMA: CardSchema = {
  cardType: 'unknown',
  sections: [
    {
      title: 'Basics',
      fields: [
        { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 200, column: 'full' },
        { name: 'description', label: 'Description', kind: 'textarea', column: 'full' },
        { name: 'expansionId', label: 'Expansion', kind: 'entity', lookup: 'expansions', required: true, allowCreate: true, column: 1 } as FieldDef,
      ],
    },
  ],
  previewTags: () => [],
};

/**
 * Schema-driven form for creating or editing weapons, armor, loot, and other
 * card types. Renders the Basics/Details/(Damage) sections defined by
 * CARD_EDIT_SCHEMAS. Feature editing (CardEditFeatures) is not part of this
 * component and stays owned by whichever parent needs it (admin CardEdit).
 */
@Component({
  selector: 'app-item-form',
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CardEditField, CardEditPreview, AddExpansionDialog],
})
export class ItemForm {
  private readonly fb = inject(FormBuilder);
  private readonly adminLookupService = inject(AdminLookupService);

  readonly cardType = input.required<string>();
  readonly mode = input.required<'create' | 'edit'>();
  readonly initialData = input<RawCardResponse | null>(null);
  readonly saving = input<boolean>(false);
  readonly submitted = input<boolean>(false);
  readonly showIsOfficialField = input<boolean>(false);
  /** Feature cards owned by a parent (e.g. admin CardEditFeatures) folded into the preview. */
  readonly extraFeatures = input<CardFeature[]>([]);

  readonly saved = output<Record<string, unknown>>();
  readonly formChanged = output<void>();

  readonly addExpansionOpen = signal(false);
  private readonly formVersion = signal(0);

  cardForm: FormGroup = this.fb.group({});

  readonly schema = computed<CardSchema>(() => CARD_EDIT_SCHEMAS[this.cardType()] ?? FALLBACK_SCHEMA);

  readonly visibleSections = computed(() => {
    const sections = this.schema().sections;
    if (this.showIsOfficialField()) return sections;
    return sections
      .map(section => ({
        ...section,
        fields: section.fields.filter(f => f.name !== 'isOfficial'),
      }))
      .filter(section => section.fields.length > 0);
  });

  readonly previewCard = computed<CardData | null>(() => {
    this.formVersion();
    if (!this.cardForm) return null;
    return buildPreviewCard(this.schema(), this.cardForm.getRawValue(), this.initialData(), this.extraFeatures());
  });

  constructor() {
    effect((onCleanup) => {
      const schema = this.schema();
      const raw = this.initialData();
      const form = buildFormFromSchema(schema, raw, this.fb);
      this.cardForm = form;
      const sub = form.valueChanges.subscribe(() => {
        this.formVersion.update(v => v + 1);
        this.formChanged.emit();
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  getControl(fieldName: string): AbstractControl {
    return this.cardForm.get(fieldName)!;
  }

  getDependsOnControl(field: FieldDef): FormControl<number | null> | undefined {
    if ((field.kind === 'entity' || field.kind === 'entityMulti') && (field as EntityField).dependsOn) {
      const dep = (field as EntityField).dependsOn!;
      const ctrl = this.cardForm?.get(dep);
      return ctrl ? ctrl as FormControl<number | null> : undefined;
    }
    return undefined;
  }

  /** Builds the payload for the current mode (create = full payload, edit = dirty-diff). */
  buildPayload(extras?: Record<string, unknown>): Record<string, unknown> {
    return buildPayloadFromSchema(this.schema(), this.cardForm, this.mode(), extras);
  }

  /** Builds the payload and emits it via `saved`, for callers that don't need it synchronously. */
  requestSave(extras?: Record<string, unknown>): void {
    this.saved.emit(this.buildPayload(extras));
  }

  hasPendingChanges(): boolean {
    return this.cardForm?.dirty ?? false;
  }

  openAddExpansionDialog(): void {
    this.addExpansionOpen.set(true);
  }

  closeAddExpansionDialog(): void {
    this.addExpansionOpen.set(false);
  }

  onAddExpansionCreated(option: ExpansionOption): void {
    this.cardForm.get('expansionId')?.setValue(option.id);
    this.cardForm.get('expansionId')?.markAsDirty();
    this.adminLookupService.invalidate('expansions');
    this.addExpansionOpen.set(false);
  }
}
