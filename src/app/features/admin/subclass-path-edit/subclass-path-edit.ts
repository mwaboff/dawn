import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, FormGroup, AbstractControl, FormControl } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { FeatureEditService } from '../../../shared/services/feature-edit.service';
import { RawCardResponse, RawFeatureResponse } from '../models/admin-api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { SubclassLevel } from '../../../shared/models/subclass-api.model';
import { PaginatedResponse } from '../../../shared/models/api.model';
import { CARD_EDIT_SCHEMAS } from '../card-edit/schema/card-edit-schema';
import { CardSchema, EntityField, FieldDef, LookupOption } from '../card-edit/schema/card-edit-schema.types';
import { buildFormFromSchema, buildPayloadFromSchema, applyBackendErrors, buildPreviewCard } from '../card-edit/utils/card-edit-form.utils';
import { AdminLookupService } from '../card-edit/services/admin-lookup.service';
import { CardEditField } from '../card-edit/components/card-edit-field/card-edit-field';
import { CardEditFeatures } from '../card-edit/components/card-edit-features/card-edit-features';
import { CardEditPreview } from '../card-edit/components/card-edit-preview/card-edit-preview';
import { AddExpansionDialog } from '../card-edit/components/add-expansion-dialog/add-expansion-dialog';
import { ExpansionOption } from '../../../shared/models/expansion-api.model';

const LEVEL_ORDER: SubclassLevel[] = ['FOUNDATION', 'SPECIALIZATION', 'MASTERY'];

const LEVEL_LABELS: Record<SubclassLevel, string> = {
  FOUNDATION: 'Foundation',
  SPECIALIZATION: 'Specialization',
  MASTERY: 'Mastery',
};

interface LevelEntry {
  level: SubclassLevel;
  label: string;
  raw: RawCardResponse;
  features: RawFeatureResponse[];
  form: FormGroup;
  saving: boolean;
  saveSuccess: boolean;
  error: string;
}

@Component({
  selector: 'app-subclass-path-edit',
  templateUrl: './subclass-path-edit.html',
  styleUrl: './subclass-path-edit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CardEditField, CardEditFeatures, CardEditPreview, AddExpansionDialog],
})
export class SubclassPathEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminCardService = inject(AdminCardService);
  private readonly featureEditService = inject(FeatureEditService);
  private readonly adminLookupService = inject(AdminLookupService);

  private readonly featureRefs = viewChildren<CardEditFeatures>('featureRef');

  readonly pathId = signal(0);
  readonly pathName = signal('');
  readonly className = signal('');
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly levels = signal<LevelEntry[]>([]);
  readonly addExpansionOpen = signal(false);
  private readonly activeExpansionLevel = signal<SubclassLevel | null>(null);
  private readonly formVersion = signal(0);

  private pathRaw = signal<Record<string, unknown> | null>(null);
  readonly domainOptions = signal<LookupOption[]>([]);
  readonly domain1 = signal<number | null>(null);
  readonly domain2 = signal<number | null>(null);
  readonly domainsSaving = signal(false);
  readonly domainsSaveSuccess = signal(false);
  readonly domainsSaveError = signal('');
  readonly domainsDirty = computed(() => {
    const raw = this.pathRaw();
    if (!raw) return false;
    const original = (raw['associatedDomainIds'] as number[]) ?? [];
    const current = [this.domain1(), this.domain2()].filter((id): id is number => id !== null);
    if (original.length !== current.length) return true;
    return !original.every((id, i) => current[i] === id);
  });

  readonly schema = computed<CardSchema>(() => CARD_EDIT_SCHEMAS['subclass']);

  readonly activeTab = signal<SubclassLevel>('FOUNDATION');

  readonly activeLevelEntry = computed(() => {
    const tab = this.activeTab();
    return this.levels().find(l => l.level === tab) ?? null;
  });

  readonly previewCard = computed<CardData | null>(() => {
    this.formVersion();
    const entry = this.activeLevelEntry();
    if (!entry) return null;

    const idx = this.levels().indexOf(entry);
    const featureRef = this.featureRefs()?.[idx];
    const features = featureRef?.getEditableFeatures().map(f => {
      const fv = f.form.getRawValue();
      return {
        id: f.id,
        name: fv.name ?? '',
        description: fv.description ?? '',
        subtitle: fv.featureType ?? '',
        tags: (f.pristine.costTags ?? []).map((t: { label: string }) => t.label.toUpperCase()),
      };
    }) ?? [];

    return buildPreviewCard(this.schema(), entry.form.getRawValue(), entry.raw, features);
  });

  readonly filteredSections = computed(() => {
    return this.schema().sections.map(section => ({
      ...section,
      fields: section.fields.filter(f =>
        f.name !== 'level' && f.name !== 'associatedClassId' && f.name !== 'subclassPathId'
      ),
    })).filter(section => section.fields.length > 0);
  });

  ngOnInit(): void {
    const pathId = Number(this.route.snapshot.params['pathId']);
    this.pathId.set(pathId);
    this.loadAll(pathId);
    this.adminLookupService.list('domains')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(options => this.domainOptions.set(options));
  }

  setActiveTab(level: SubclassLevel): void {
    this.activeTab.set(level);
  }

  getControl(entry: LevelEntry, fieldName: string): AbstractControl {
    return entry.form.get(fieldName)!;
  }

  getDependsOnControl(entry: LevelEntry, field: FieldDef): FormControl<number | null> | undefined {
    if ((field.kind === 'entity' || field.kind === 'entityMulti') && (field as EntityField).dependsOn) {
      const dep = (field as EntityField).dependsOn!;
      const ctrl = entry.form?.get(dep);
      return ctrl ? ctrl as FormControl<number | null> : undefined;
    }
    return undefined;
  }

  bumpFormVersion(): void {
    this.formVersion.update(v => v + 1);
  }

  onSaveLevel(level: SubclassLevel): void {
    const entry = this.levels().find(l => l.level === level);
    if (!entry) return;

    const idx = this.levels().indexOf(entry);
    this.updateLevel(level, { saving: true, saveSuccess: false, error: '' });

    const saves: Observable<unknown>[] = [];

    if (entry.form.dirty) {
      saves.push(this.adminCardService.updateCard('subclass', entry.raw.id, buildPayloadFromSchema(this.schema(), entry.form)));
    }

    const featureRef = this.featureRefs()?.[idx];
    if (featureRef) {
      for (const feature of featureRef.getDirtyFeatures()) {
        saves.push(this.featureEditService.updateFeature(feature.id, featureRef.buildFeaturePayload(feature)));
      }
    }

    if (saves.length === 0) {
      this.updateLevel(level, { saving: false });
      return;
    }

    forkJoin(saves)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateLevel(level, { saving: false, saveSuccess: true });
          this.loadAll(this.pathId());
        },
        error: (err) => {
          const errorBody = err?.error;
          const banner = applyBackendErrors(entry.form, errorBody);
          const hasFieldErrors = errorBody && Array.isArray(errorBody['errors']) && errorBody['errors'].length > 0;
          this.updateLevel(level, {
            saving: false,
            error: banner ?? (hasFieldErrors ? '' : 'Save failed. Please try again.'),
          });
        },
      });
  }

  hasPendingChanges(entry: LevelEntry, idx: number): boolean {
    if (entry.form?.dirty) return true;
    return (this.featureRefs()?.[idx]?.getDirtyFeatures().length ?? 0) > 0;
  }

  onDomainChange(slot: 1 | 2, value: string): void {
    const id = value ? Number(value) : null;
    if (slot === 1) this.domain1.set(id);
    else this.domain2.set(id);
    this.domainsSaveSuccess.set(false);
  }

  onSaveDomains(): void {
    const raw = this.pathRaw();
    if (!raw) return;

    this.domainsSaving.set(true);
    this.domainsSaveSuccess.set(false);
    this.domainsSaveError.set('');

    const associatedDomainIds = [this.domain1(), this.domain2()].filter((id): id is number => id !== null);

    const body = {
      name: raw['name'],
      associatedClassId: raw['associatedClassId'],
      expansionId: raw['expansionId'],
      spellcastingTrait: (raw['spellcastingTrait'] as Record<string, unknown>)?.['trait'] ?? null,
      associatedDomainIds,
    };

    this.http.put(`${environment.apiUrl}/dh/subclass-paths/${this.pathId()}`, body, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.domainsSaving.set(false);
          this.domainsSaveSuccess.set(true);
          this.loadAll(this.pathId());
        },
        error: (err) => {
          this.domainsSaving.set(false);
          this.domainsSaveError.set(err?.error?.message ?? 'Failed to save domains.');
        },
      });
  }

  onBack(): void {
    this.router.navigate(['/admin/cards']);
  }

  openAddExpansionDialog(level: SubclassLevel): void {
    this.activeExpansionLevel.set(level);
    this.addExpansionOpen.set(true);
  }

  closeAddExpansionDialog(): void {
    this.addExpansionOpen.set(false);
    this.activeExpansionLevel.set(null);
  }

  onAddExpansionCreated(option: ExpansionOption): void {
    const level = this.activeExpansionLevel();
    if (level) {
      const entry = this.levels().find(l => l.level === level);
      if (entry) {
        entry.form.get('expansionId')?.setValue(option.id);
        entry.form.get('expansionId')?.markAsDirty();
      }
    }
    this.adminLookupService.invalidate('expansions');
    this.addExpansionOpen.set(false);
    this.activeExpansionLevel.set(null);
  }

  private loadAll(pathId: number): void {
    this.loading.set(true);
    this.loadError.set('');

    const pathUrl = `${environment.apiUrl}/dh/subclass-paths/${pathId}`;
    const pathParams = new HttpParams().set('expand', 'associatedClass');

    const cardsUrl = `${environment.apiUrl}/dh/cards/subclass`;
    const cardsParams = new HttpParams()
      .set('subclassPathId', pathId)
      .set('expand', 'features,costTags,modifiers,expansion,subclassPath')
      .set('size', '10');

    forkJoin({
      path: this.http.get<Record<string, unknown>>(pathUrl, { params: pathParams, withCredentials: true }),
      cards: this.http.get<PaginatedResponse<RawCardResponse>>(cardsUrl, { params: cardsParams, withCredentials: true }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ path, cards }) => {
          this.pathRaw.set(path);
          this.pathName.set(path['name'] as string ?? 'Subclass Path');
          const assocClass = path['associatedClass'] as Record<string, unknown> | undefined;
          this.className.set(assocClass?.['name'] as string ?? '');

          const domainIds = (path['associatedDomainIds'] as number[]) ?? [];
          this.domain1.set(domainIds[0] ?? null);
          this.domain2.set(domainIds[1] ?? null);

          const levelEntries: LevelEntry[] = [];

          for (const level of LEVEL_ORDER) {
            const raw = cards.content.find(c => c['level'] === level);
            if (!raw) continue;

            const features = (raw.features ?? []) as RawFeatureResponse[];
            const form = buildFormFromSchema(this.schema(), raw, this.fb);
            form.valueChanges
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.formVersion.update(v => v + 1));

            levelEntries.push({
              level,
              label: LEVEL_LABELS[level],
              raw,
              features,
              form,
              saving: false,
              saveSuccess: false,
              error: '',
            });
          }

          this.levels.set(levelEntries);
          if (levelEntries.length > 0 && !levelEntries.find(l => l.level === this.activeTab())) {
            this.activeTab.set(levelEntries[0].level);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'Failed to load subclass path.');
          this.loading.set(false);
        },
      });
  }

  private updateLevel(level: SubclassLevel, updates: Partial<LevelEntry>): void {
    this.levels.update(ls => ls.map(l => l.level === level ? { ...l, ...updates } : l));
  }
}
