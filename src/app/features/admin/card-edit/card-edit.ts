import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormGroup, AbstractControl, FormControl } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { FeatureEditService } from '../../../shared/services/feature-edit.service';
import { RawCardResponse, RawFeatureResponse } from '../models/admin-api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { CARD_EDIT_SCHEMAS } from './schema/card-edit-schema';
import { CardSchema, EntityField, FieldDef } from './schema/card-edit-schema.types';
import { buildFormFromSchema, buildPayloadFromSchema, applyBackendErrors, buildPreviewCard } from './utils/card-edit-form.utils';
import { AdminLookupService } from './services/admin-lookup.service';
import { CardEditToolbar } from './components/card-edit-toolbar/card-edit-toolbar';
import { CardEditField } from './components/card-edit-field/card-edit-field';
import { CardEditFeatures } from './components/card-edit-features/card-edit-features';
import { CardEditPreview } from './components/card-edit-preview/card-edit-preview';
import { AddExpansionDialog } from './components/add-expansion-dialog/add-expansion-dialog';
import { ExpansionOption } from '../../../shared/models/expansion-api.model';

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

@Component({
  selector: 'app-card-edit',
  templateUrl: './card-edit.html',
  styleUrl: './card-edit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CardEditToolbar, CardEditField, CardEditFeatures, CardEditPreview, AddExpansionDialog],
})
export class CardEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminCardService = inject(AdminCardService);
  private readonly featureEditService = inject(FeatureEditService);
  private readonly adminLookupService = inject(AdminLookupService);

  private readonly featuresRef = viewChild<CardEditFeatures>('featuresRef');

  readonly cardType = signal('');
  readonly cardId = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly saveSuccess = signal(false);
  readonly submitted = signal(false);
  readonly addExpansionOpen = signal(false);
  readonly rawCard = signal<RawCardResponse | null>(null);
  readonly rawFeatures = signal<RawFeatureResponse[]>([]);
  private readonly formVersion = signal(0);

  cardForm!: FormGroup;

  readonly schema = computed<CardSchema>(() => CARD_EDIT_SCHEMAS[this.cardType()] ?? FALLBACK_SCHEMA);

  readonly previewCard = computed<CardData | null>(() => {
    this.formVersion();
    const raw = this.rawCard();
    if (!raw || !this.cardForm) return null;

    const features = this.featuresRef()?.getEditableFeatures().map(f => {
      const fv = f.form.getRawValue();
      return {
        id: f.id,
        name: fv.name ?? '',
        description: fv.description ?? '',
        subtitle: fv.featureType ?? '',
        tags: (f.pristine.costTags ?? []).map((t: { label: string }) => t.label.toUpperCase()),
      };
    }) ?? [];

    return buildPreviewCard(this.schema(), this.cardForm.getRawValue(), raw, features);
  });

  readonly hasPendingChanges = computed(() => {
    this.formVersion();
    if (this.cardForm?.dirty) return true;
    return (this.featuresRef()?.getDirtyFeatures().length ?? 0) > 0;
  });

  ngOnInit(): void {
    this.cardForm = this.fb.nonNullable.group({ name: [''], description: [''] });

    const params = this.route.snapshot.params;
    this.cardType.set(params['cardType']);
    this.cardId.set(Number(params['id']));
    this.loadCard();
  }

  getDependsOnControl(field: FieldDef): FormControl<number | null> | undefined {
    if ((field.kind === 'entity' || field.kind === 'entityMulti') && (field as EntityField).dependsOn) {
      const dep = (field as EntityField).dependsOn!;
      const ctrl = this.cardForm?.get(dep);
      return ctrl ? ctrl as FormControl<number | null> : undefined;
    }
    return undefined;
  }

  getControl(fieldName: string): AbstractControl {
    return this.cardForm.get(fieldName)!;
  }

  bumpFormVersion(): void {
    this.formVersion.update(v => v + 1);
  }

  onSave(): void {
    this.submitted.set(true);
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set('');

    const saves: Observable<unknown>[] = [];

    if (this.cardForm.dirty) {
      saves.push(this.adminCardService.updateCard(
        this.cardType(), this.cardId(),
        buildPayloadFromSchema(this.schema(), this.cardForm),
      ));
    }

    const featuresComp = this.featuresRef();
    if (featuresComp) {
      for (const feature of featuresComp.getDirtyFeatures()) {
        saves.push(this.featureEditService.updateFeature(feature.id, featuresComp.buildFeaturePayload(feature)));
      }
    }

    if (saves.length === 0) {
      this.saving.set(false);
      return;
    }

    forkJoin(saves)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saveSuccess.set(true);
          this.loadCard();
        },
        error: (err) => {
          this.saving.set(false);
          const errorBody = err?.error;
          const banner = applyBackendErrors(this.cardForm, errorBody);
          const hasFieldErrors = errorBody && Array.isArray(errorBody['errors']) && errorBody['errors'].length > 0;
          this.error.set(banner ?? (hasFieldErrors ? '' : 'Save failed. Please try again.'));
        },
      });
  }

  onBack(): void {
    this.router.navigate(['/admin/cards']);
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

  private loadCard(): void {
    this.loading.set(true);
    this.error.set('');

    this.adminCardService
      .getCard(this.cardType(), this.cardId(), 'features,costTags,modifiers,expansion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const raw = response as RawCardResponse;
          this.rawCard.set(raw);
          this.rawFeatures.set(raw.features ?? []);
          this.cardForm = buildFormFromSchema(this.schema(), raw, this.fb);
          this.cardForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.formVersion.update(v => v + 1));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load card.');
          this.loading.set(false);
        },
      });
  }
}
