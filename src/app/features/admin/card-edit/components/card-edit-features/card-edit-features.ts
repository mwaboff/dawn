import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  effect,
  inject,
  DestroyRef,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RawFeatureResponse, FeatureUpdateRequest, FeatureInput } from '../../../models/admin-api.model';
import { CostTagLookupService, CostTagFull } from '../../../../../shared/services/cost-tag-lookup.service';
import {
  FeatureType,
  FEATURE_TYPE_LABELS,
  defaultFeatureTypeForCard,
} from '../../../../../shared/models/feature-type.model';
import { ConfirmDialog } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

const MODIFIER_TARGETS = [
  'AGILITY', 'STRENGTH', 'FINESSE', 'INSTINCT', 'PRESENCE', 'KNOWLEDGE',
  'EVASION', 'MAJOR_DAMAGE_THRESHOLD', 'SEVERE_DAMAGE_THRESHOLD',
  'HIT_POINT_MAX', 'STRESS_MAX', 'HOPE_MAX', 'ARMOR_MAX', 'GOLD',
  'ATTACK_ROLL', 'DAMAGE_ROLL', 'PRIMARY_DAMAGE_ROLL', 'ARMOR_SCORE',
  'BONUS_DOMAIN_CARD_SELECTIONS',
  'BONUS_EXPERIENCE_MODIFIER',
] as const;

const MODIFIER_OPERATIONS = ['ADD', 'SET', 'MULTIPLY'] as const;
const COST_TAG_CATEGORIES = ['COST', 'LIMITATION', 'TIMING'] as const;

export interface EditableFeature {
  id: number;
  isNew: boolean;
  pristine: RawFeatureResponse;
  form: FormGroup;
  expanded: boolean;
  costTags: { label: string; category: string }[];
  modifiers: { target: string; operation: string; value: number }[];
  tagsDirty: boolean;
  modifiersDirty: boolean;
  showAddTag: boolean;
  showAddModifier: boolean;
  addTagForm: FormGroup;
  addModifierForm: FormGroup;
}

@Component({
  selector: 'app-card-edit-features',
  templateUrl: './card-edit-features.html',
  styleUrl: './card-edit-features.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ConfirmDialog],
})
export class CardEditFeatures {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly costTagLookupService = inject(CostTagLookupService);

  readonly features = input<RawFeatureResponse[]>([]);
  readonly saving = input<boolean>(false);
  readonly groupByType = input<boolean>(false);
  readonly cardType = input<string>('');
  readonly expansionId = input<number>(0);

  readonly featureDirtyChanged = output<void>();
  readonly deleteFeature = output<number>();

  readonly pendingDeleteId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  private readonly editableFeatures = signal<EditableFeature[]>([]);
  readonly availableCostTags = signal<CostTagFull[]>([]);

  private readonly featureTypeLabels: Record<string, string> = {
    HOPE: 'Hope Features',
    CLASS: 'Class Features',
  };

  readonly modifierTargets = MODIFIER_TARGETS;
  readonly modifierOperations = MODIFIER_OPERATIONS;
  readonly costTagCategories = COST_TAG_CATEGORIES;

  readonly featureTypeOptions = computed(() =>
    (Object.keys(FEATURE_TYPE_LABELS) as FeatureType[]).map(value => ({
      value,
      label: FEATURE_TYPE_LABELS[value],
    })),
  );

  constructor() {
    effect(() => this.populateFeatures(this.features()));
    this.costTagLookupService.listFull()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tags => this.availableCostTags.set(tags));
  }

  getEditableFeatures(): EditableFeature[] {
    return this.editableFeatures();
  }

  getFeatureGroups(): { label: string; features: EditableFeature[] }[] {
    const all = this.editableFeatures();
    if (!this.groupByType() || all.length === 0) return [{ label: 'Features', features: all }];
    const groups = new Map<string, EditableFeature[]>();
    for (const f of all) {
      const type = f.form.getRawValue().featureType ?? 'OTHER';
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(f);
    }
    return Array.from(groups.entries()).map(([type, features]) => ({
      label: this.featureTypeLabels[type] ?? type,
      features,
    }));
  }

  getGlobalIndex(feature: EditableFeature): number {
    return this.editableFeatures().indexOf(feature);
  }

  getDirtyFeatures(): EditableFeature[] {
    return this.editableFeatures().filter(f => this.isDirty(f));
  }

  getDraftFeatures(): EditableFeature[] {
    return this.editableFeatures().filter(f => f.isNew);
  }

  getExistingDirtyFeatures(): EditableFeature[] {
    return this.editableFeatures().filter(f => !f.isNew && this.isDirty(f));
  }

  isDirty(feature: EditableFeature): boolean {
    if (feature.isNew) return true;
    return feature.form.dirty || feature.tagsDirty || feature.modifiersDirty;
  }

  buildFeaturePayload(feature: EditableFeature): FeatureUpdateRequest {
    const fv = feature.form.getRawValue();
    return {
      name: fv.name,
      description: fv.description,
      featureType: fv.featureType,
      expansionId: feature.pristine.expansionId,
      costTags: feature.costTags,
      modifiers: feature.modifiers,
    };
  }

  buildNewFeaturePayload(feature: EditableFeature): FeatureInput {
    const fv = feature.form.getRawValue();
    return {
      name: fv.name,
      description: fv.description,
      featureType: fv.featureType,
      expansionId: this.expansionId(),
      costTags: feature.costTags,
      modifiers: feature.modifiers,
    };
  }

  addDraft(): void {
    const defaultType = defaultFeatureTypeForCard(this.cardType());
    const form = this.fb.nonNullable.group({
      name: [''],
      description: [''],
      featureType: [defaultType as FeatureType],
    });
    form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.featureDirtyChanged.emit());

    const pristine: RawFeatureResponse = {
      id: 0,
      name: '',
      description: '',
      featureType: defaultType,
      expansionId: this.expansionId(),
      costTagIds: [],
      modifierIds: [],
      costTags: [],
      modifiers: [],
    };

    const draft: EditableFeature = {
      id: 0,
      isNew: true,
      pristine,
      form,
      expanded: true,
      costTags: [],
      modifiers: [],
      tagsDirty: false,
      modifiersDirty: false,
      showAddTag: false,
      showAddModifier: false,
      addTagForm: this.fb.group({ newLabel: [''], newCategory: ['COST'] }),
      addModifierForm: this.fb.group({ target: ['AGILITY'], operation: ['ADD'], value: [0] }),
    };

    this.editableFeatures.update(fs => [draft, ...fs]);
    this.featureDirtyChanged.emit();
  }

  discardDraft(index: number): void {
    const current = this.editableFeatures();
    if (index < 0 || index >= current.length) return;
    if (!current[index].isNew) return;
    this.editableFeatures.update(fs => fs.filter((_, i) => i !== index));
    this.featureDirtyChanged.emit();
  }

  toggleFeature(index: number): void {
    this.editableFeatures.update(fs =>
      fs.map((f, i) => i === index ? { ...f, expanded: !f.expanded } : f)
    );
  }

  toggleAddTag(index: number): void {
    this.editableFeatures.update(fs =>
      fs.map((f, i) => i === index ? { ...f, showAddTag: !f.showAddTag } : f)
    );
  }

  onTagLabelInput(featureIndex: number, value: string): void {
    const match = this.availableCostTags().find(t => t.label.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      this.editableFeatures()[featureIndex].addTagForm.patchValue({ newCategory: match.category });
    }
  }

  toggleAddModifier(index: number): void {
    this.editableFeatures.update(fs =>
      fs.map((f, i) => i === index ? { ...f, showAddModifier: !f.showAddModifier } : f)
    );
  }

  addCostTag(featureIndex: number): void {
    const feature = this.editableFeatures()[featureIndex];
    const v = feature.addTagForm.getRawValue() as { newLabel: string; newCategory: string };
    const label = v.newLabel.trim();
    if (!label) return;

    const existingMatch = this.availableCostTags().find(t => t.label.toLowerCase() === label.toLowerCase());
    const category = existingMatch ? existingMatch.category : v.newCategory;
    const tag = { label: existingMatch ? existingMatch.label : label, category };

    if (feature.costTags.some(t => t.label.toLowerCase() === tag.label.toLowerCase())) return;

    this.editableFeatures.update(fs => fs.map((f, i) =>
      i !== featureIndex ? f : { ...f, costTags: [...f.costTags, tag], tagsDirty: true, showAddTag: false }
    ));
    feature.addTagForm.reset({ newLabel: '', newCategory: 'COST' });
    this.featureDirtyChanged.emit();
  }

  removeCostTag(featureIndex: number, tagIndex: number): void {
    this.editableFeatures.update(fs => fs.map((f, i) =>
      i !== featureIndex ? f : { ...f, costTags: f.costTags.filter((_, ti) => ti !== tagIndex), tagsDirty: true }
    ));
    this.featureDirtyChanged.emit();
  }

  addModifier(featureIndex: number): void {
    const feature = this.editableFeatures()[featureIndex];
    const v = feature.addModifierForm.getRawValue() as { target: string; operation: string; value: number | null };
    if (v.value === null || v.value === undefined) return;
    const mod = { target: v.target, operation: v.operation, value: v.value };
    this.editableFeatures.update(fs => fs.map((f, i) =>
      i !== featureIndex ? f : { ...f, modifiers: [...f.modifiers, mod], modifiersDirty: true, showAddModifier: false }
    ));
    this.featureDirtyChanged.emit();
  }

  removeModifier(featureIndex: number, modIndex: number): void {
    this.editableFeatures.update(fs => fs.map((f, i) =>
      i !== featureIndex ? f : { ...f, modifiers: f.modifiers.filter((_, mi) => mi !== modIndex), modifiersDirty: true }
    ));
    this.featureDirtyChanged.emit();
  }

  onDeleteFeatureClick(event: Event, id: number): void {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
  }

  onInlineDeleteConfirm(event: Event): void {
    event.stopPropagation();
    this.confirmingDeleteId.set(this.pendingDeleteId());
  }

  onInlineDeleteCancel(event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const id = this.confirmingDeleteId();
    if (id !== null) {
      this.deletingId.set(id);
      this.deleteFeature.emit(id);
    }
  }

  onCancelDelete(): void {
    this.confirmingDeleteId.set(null);
    this.pendingDeleteId.set(null);
  }

  resetDeleteState(): void {
    this.pendingDeleteId.set(null);
    this.confirmingDeleteId.set(null);
    this.deletingId.set(null);
  }

  private populateFeatures(rawFeatures: RawFeatureResponse[]): void {
    this.editableFeatures.set(rawFeatures.map(f => {
      const form = this.fb.nonNullable.group({
        name: [f.name],
        description: [f.description],
        featureType: [f.featureType as FeatureType],
      });
      form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.featureDirtyChanged.emit());
      return {
        id: f.id,
        isNew: false,
        pristine: { ...f },
        form,
        expanded: false,
        costTags: (f.costTags ?? []).map(t => ({ label: t.label, category: t.category })),
        modifiers: (f.modifiers ?? []).map(m => ({ target: m.target, operation: m.operation, value: m.value })),
        tagsDirty: false,
        modifiersDirty: false,
        showAddTag: false,
        showAddModifier: false,
        addTagForm: this.fb.group({ newLabel: [''], newCategory: ['COST'] }),
        addModifierForm: this.fb.group({ target: ['AGILITY'], operation: ['ADD'], value: [0] }),
      };
    }));
  }
}
