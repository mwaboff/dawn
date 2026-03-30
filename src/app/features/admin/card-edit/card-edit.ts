import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { DaggerheartCard } from '../../../shared/components/daggerheart-card/daggerheart-card';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { FeatureEditService } from '../../../shared/services/feature-edit.service';
import { RawCardResponse, RawFeatureResponse, FeatureUpdateRequest } from '../models/admin-api.model';
import { CardData, CardType } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

interface EditableFeature {
  id: number;
  pristine: RawFeatureResponse;
  form: FormGroup;
  expanded: boolean;
}

@Component({
  selector: 'app-card-edit',
  templateUrl: './card-edit.html',
  styleUrl: './card-edit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DaggerheartCard],
})
export class CardEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminCardService = inject(AdminCardService);
  private readonly featureEditService = inject(FeatureEditService);

  readonly cardType = signal('');
  readonly cardId = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly saveSuccess = signal(false);
  readonly rawCard = signal<RawCardResponse | null>(null);
  readonly features = signal<EditableFeature[]>([]);
  private readonly formVersion = signal(0);

  cardForm!: FormGroup;

  private readonly CARD_TYPE_MAP: Record<string, CardType> = {
    'class': 'class',
    'subclass': 'subclass',
    'ancestry': 'ancestry',
    'community': 'community',
    'domain': 'domain',
    'domainCard': 'domain',
    'weapon': 'weapon',
    'armor': 'armor',
    'loot': 'loot',
    'companion': 'companion',
    'subclassPath': 'subclassPath',
  };

  readonly previewCard = computed<CardData | null>(() => {
    this.formVersion();
    const raw = this.rawCard();
    if (!raw || !this.cardForm) return null;

    const formValue = this.cardForm.getRawValue();
    const featureList = this.features().map(f => {
      const fv = f.form.getRawValue();
      return {
        id: f.id,
        name: fv.name ?? '',
        description: fv.description ?? '',
        subtitle: fv.featureType ?? '',
        tags: (f.pristine.costTags ?? []).map((t: { label: string }) => t.label.toUpperCase()),
      };
    });

    const cardTypeKey = this.CARD_TYPE_MAP[this.cardType()] ?? 'class';

    return {
      id: raw.id,
      name: formValue.name ?? '',
      description: formValue.description ?? '',
      cardType: cardTypeKey,
      subtitle: this.buildPreviewSubtitle(formValue),
      tags: this.buildPreviewTags(formValue),
      features: featureList.length > 0 ? featureList : undefined,
      metadata: {},
    };
  });

  readonly hasPendingChanges = computed(() => {
    this.formVersion();
    if (this.cardForm?.dirty) return true;
    return this.features().some(f => f.form.dirty);
  });

  ngOnInit(): void {
    this.cardForm = this.fb.nonNullable.group({
      name: [''],
      description: [''],
    });

    const params = this.route.snapshot.params;
    this.cardType.set(params['cardType']);
    this.cardId.set(Number(params['id']));
    this.loadCard();
  }

  toggleFeature(index: number): void {
    this.features.update(features =>
      features.map((f, i) => i === index ? { ...f, expanded: !f.expanded } : f)
    );
  }

  onSave(): void {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set('');

    const saves: Observable<unknown>[] = [];

    if (this.cardForm.dirty) {
      saves.push(this.adminCardService.updateCard(this.cardType(), this.cardId(), this.buildCardPayload()));
    }

    for (const feature of this.features()) {
      if (feature.form.dirty) {
        saves.push(this.featureEditService.updateFeature(feature.id, this.buildFeaturePayload(feature)));
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
          this.error.set(err?.error?.message ?? 'Save failed. Please try again.');
        },
      });
  }

  onBack(): void {
    this.router.navigate(['/admin/cards']);
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
          this.populateForm(raw);
          this.populateFeatures(raw.features ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load card.');
          this.loading.set(false);
        },
      });
  }

  private populateForm(raw: RawCardResponse): void {
    const group: Record<string, unknown[]> = {
      name: [raw.name ?? ''],
      description: [raw.description ?? ''],
    };

    const type = this.cardType();
    if (type === 'domainCard') {
      group['level'] = [raw['level'] ?? 1];
      group['recallCost'] = [raw['recallCost'] ?? 0];
      group['type'] = [raw['type'] ?? 'SPELL'];
    } else if (type === 'class') {
      group['startingEvasion'] = [raw['startingEvasion'] ?? 0];
      group['startingHitPoints'] = [raw['startingHitPoints'] ?? 0];
    } else if (type === 'weapon') {
      group['tier'] = [raw['tier'] ?? 1];
      group['trait'] = [raw['trait'] ?? ''];
      group['range'] = [raw['range'] ?? ''];
      group['burden'] = [raw['burden'] ?? ''];
    } else if (type === 'armor') {
      group['tier'] = [raw['tier'] ?? 1];
      group['baseScore'] = [raw['baseScore'] ?? 0];
      group['baseMajorThreshold'] = [raw['baseMajorThreshold'] ?? 0];
      group['baseSevereThreshold'] = [raw['baseSevereThreshold'] ?? 0];
    } else if (type === 'loot') {
      group['tier'] = [raw['tier'] ?? 1];
      group['isConsumable'] = [raw['isConsumable'] ?? false];
      group['cost'] = [raw['cost'] ?? ''];
    }

    this.cardForm = this.fb.nonNullable.group(group);
    this.cardForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formVersion.update(v => v + 1));
  }

  private populateFeatures(features: RawFeatureResponse[]): void {
    this.features.set(
      features.map(f => {
        const form = this.fb.nonNullable.group({
          name: [f.name],
          description: [f.description],
          featureType: [f.featureType],
        });
        form.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.formVersion.update(v => v + 1));
        return { id: f.id, pristine: { ...f }, form, expanded: false };
      })
    );
  }

  private buildCardPayload(): Record<string, unknown> {
    const formValue = this.cardForm.getRawValue();
    const payload: Record<string, unknown> = {
      name: formValue.name,
      description: formValue.description,
    };

    const type = this.cardType();
    if (type === 'domainCard') {
      payload['level'] = formValue['level'];
      payload['recallCost'] = formValue['recallCost'];
      payload['type'] = formValue['type'];
    } else if (type === 'class') {
      payload['startingEvasion'] = formValue['startingEvasion'];
      payload['startingHitPoints'] = formValue['startingHitPoints'];
    } else if (type === 'weapon') {
      payload['tier'] = formValue['tier'];
      payload['trait'] = formValue['trait'];
      payload['range'] = formValue['range'];
      payload['burden'] = formValue['burden'];
    } else if (type === 'armor') {
      payload['tier'] = formValue['tier'];
      payload['baseScore'] = formValue['baseScore'];
      payload['baseMajorThreshold'] = formValue['baseMajorThreshold'];
      payload['baseSevereThreshold'] = formValue['baseSevereThreshold'];
    } else if (type === 'loot') {
      payload['tier'] = formValue['tier'];
      payload['isConsumable'] = formValue['isConsumable'];
      payload['cost'] = formValue['cost'];
    }

    return payload;
  }

  private buildFeaturePayload(feature: EditableFeature): FeatureUpdateRequest {
    const fv = feature.form.getRawValue();
    return {
      name: fv.name,
      description: fv.description,
      featureType: fv.featureType,
      expansionId: feature.pristine.expansionId,
      costTags: (feature.pristine.costTags ?? []).map(t => ({ label: t.label, category: t.category })),
      modifiers: (feature.pristine.modifiers ?? []).map(m => ({ target: m.target, operation: m.operation, value: m.value })),
    };
  }

  private buildPreviewTags(formValue: Record<string, unknown>): string[] | undefined {
    const tags: string[] = [];
    const type = this.cardType();

    if (type === 'domainCard') {
      if (formValue['level']) tags.push(`Level ${formValue['level']}`);
      if (formValue['type']) tags.push(String(formValue['type']));
      if (formValue['recallCost'] && Number(formValue['recallCost']) > 0) tags.push(`Recall: ${formValue['recallCost']}`);
    } else if (type === 'class') {
      if (formValue['startingEvasion'] != null) tags.push(`Evasion: ${formValue['startingEvasion']}`);
      if (formValue['startingHitPoints'] != null) tags.push(`HP: ${formValue['startingHitPoints']}`);
    } else if (type === 'weapon') {
      if (formValue['trait']) tags.push(String(formValue['trait']));
      if (formValue['range']) tags.push(String(formValue['range']));
      if (formValue['burden']) tags.push(String(formValue['burden']));
    } else if (type === 'armor' || type === 'loot') {
      if (formValue['tier']) tags.push(`Tier ${formValue['tier']}`);
    }

    return tags.length > 0 ? tags : undefined;
  }

  private buildPreviewSubtitle(formValue: Record<string, unknown>): string | undefined {
    const type = this.cardType();
    if (type === 'weapon' && formValue['trait']) return `${formValue['trait']} Weapon`;
    return undefined;
  }
}
