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
import { forkJoin, Observable } from 'rxjs';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { FeatureEditService } from '../../../shared/services/feature-edit.service';
import { RawCardResponse, RawFeatureResponse, FeatureInput } from '../models/admin-api.model';
import { EditableFeature } from './components/card-edit-features/card-edit-features';
import { CardFeature } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { applyBackendErrors } from '../../../shared/components/item-form/utils/card-edit-form.utils';
import { ItemForm } from '../../../shared/components/item-form/item-form';
import { CardEditToolbar } from './components/card-edit-toolbar/card-edit-toolbar';
import { CardEditFeatures } from './components/card-edit-features/card-edit-features';

@Component({
  selector: 'app-card-edit',
  templateUrl: './card-edit.html',
  styleUrl: './card-edit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardEditToolbar, CardEditFeatures, ItemForm],
})
export class CardEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminCardService = inject(AdminCardService);
  private readonly featureEditService = inject(FeatureEditService);

  private readonly featuresRef = viewChild<CardEditFeatures>('featuresRef');
  private readonly itemFormRef = viewChild<ItemForm>('itemFormRef');

  readonly cardType = signal('');
  readonly cardId = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly error = signal('');
  readonly saveSuccess = signal(false);
  readonly submitted = signal(false);
  readonly rawCard = signal<RawCardResponse | null>(null);
  readonly rawFeatures = signal<RawFeatureResponse[]>([]);
  private readonly formVersion = signal(0);

  readonly previewFeatures = computed<CardFeature[]>(() => {
    this.formVersion();
    return this.featuresRef()?.getEditableFeatures().map(f => {
      const fv = f.form.getRawValue();
      return {
        id: f.id,
        name: fv.name ?? '',
        description: fv.description ?? '',
        subtitle: fv.featureType ?? '',
        tags: (f.pristine.costTags ?? []).map((t: { label: string }) => t.label.toUpperCase()),
      };
    }) ?? [];
  });

  readonly hasPendingChanges = computed(() => {
    this.formVersion();
    if (this.itemFormRef()?.hasPendingChanges()) return true;
    return (this.featuresRef()?.getDirtyFeatures().length ?? 0) > 0;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.params;
    this.cardType.set(params['cardType']);
    this.cardId.set(Number(params['id']));
    this.loadCard();
  }

  bumpFormVersion(): void {
    this.formVersion.update(v => v + 1);
  }

  onSave(): void {
    this.submitted.set(true);
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set('');

    const itemForm = this.itemFormRef();
    const saves: Observable<unknown>[] = [];
    const featuresComp = this.featuresRef();
    const drafts = featuresComp?.getDraftFeatures() ?? [];
    const extras = this.buildDraftsExtras(featuresComp, drafts);

    if ((itemForm?.hasPendingChanges() ?? false) || drafts.length > 0) {
      saves.push(this.adminCardService.updateCard(
        this.cardType(), this.cardId(),
        itemForm!.buildPayload(extras),
      ));
    }

    if (featuresComp) {
      for (const feature of featuresComp.getExistingDirtyFeatures()) {
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
          const banner = itemForm ? applyBackendErrors(itemForm.cardForm, errorBody) : null;
          const hasFieldErrors = errorBody && Array.isArray(errorBody['errors']) && errorBody['errors'].length > 0;
          this.error.set(banner ?? (hasFieldErrors ? '' : 'Save failed. Please try again.'));
        },
      });
  }

  onDelete(): void {
    this.deleting.set(true);
    this.error.set('');
    this.adminCardService.deleteCard(this.cardType(), this.cardId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.router.navigate(['/admin/cards']);
        },
        error: (err) => {
          this.deleting.set(false);
          this.error.set(err?.error?.message ?? 'Delete failed. Please try again.');
        },
      });
  }

  onDeleteFeature(id: number): void {
    this.error.set('');
    this.featureEditService.deleteFeature(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.featuresRef()?.resetDeleteState();
          this.loadCard();
        },
        error: (err) => {
          this.featuresRef()?.resetDeleteState();
          this.error.set(err?.error?.message ?? 'Delete feature failed. Please try again.');
        },
      });
  }

  onBack(): void {
    this.router.navigate(['/admin/cards']);
  }

  private buildDraftsExtras(
    featuresComp: CardEditFeatures | undefined,
    drafts: EditableFeature[],
  ): Record<string, unknown> | undefined {
    if (!featuresComp || drafts.length === 0) return undefined;
    const newPayloads = drafts.map(d => featuresComp.buildNewFeaturePayload(d));
    const existing = this.rawFeatures();

    if (this.cardType() === 'class') {
      const hopeFeatureIds: number[] = [];
      const classFeatureIds: number[] = [];
      for (const f of existing) {
        if (f.featureType === 'HOPE') hopeFeatureIds.push(f.id);
        else classFeatureIds.push(f.id);
      }
      const hopeFeatures: FeatureInput[] = [];
      const classFeatures: FeatureInput[] = [];
      for (const p of newPayloads) {
        if (p.featureType === 'HOPE') hopeFeatures.push(p);
        else classFeatures.push(p);
      }
      return {
        hopeFeatureIds,
        classFeatureIds,
        hopeFeatures,
        classFeatures,
      };
    }

    return {
      featureIds: existing.map(f => f.id),
      features: newPayloads,
    };
  }

  private extractFeatures(raw: RawCardResponse): RawFeatureResponse[] {
    if (raw.features?.length) return raw.features;
    const hope = (raw['hopeFeatures'] as RawFeatureResponse[] | undefined) ?? [];
    const cls = (raw['classFeatures'] as RawFeatureResponse[] | undefined) ?? [];
    if (hope.length || cls.length) return [...hope, ...cls];
    return [];
  }

  private loadCard(): void {
    this.loading.set(true);
    this.error.set('');

    const expand = this.cardType() === 'class'
      ? 'classFeatures,hopeFeatures,costTags,modifiers,expansion'
      : 'features,costTags,modifiers,expansion';

    this.adminCardService
      .getCard(this.cardType(), this.cardId(), expand)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const raw = response as RawCardResponse;
          this.rawCard.set(raw);
          this.rawFeatures.set(this.extractFeatures(raw));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load card.');
          this.loading.set(false);
        },
      });
  }
}
