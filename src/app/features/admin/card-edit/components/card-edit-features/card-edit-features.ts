import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  effect,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RawFeatureResponse, FeatureUpdateRequest } from '../../../models/admin-api.model';

export interface EditableFeature {
  id: number;
  pristine: RawFeatureResponse;
  form: FormGroup;
  expanded: boolean;
}

@Component({
  selector: 'app-card-edit-features',
  templateUrl: './card-edit-features.html',
  styleUrl: './card-edit-features.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class CardEditFeatures {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly features = input<RawFeatureResponse[]>([]);
  readonly saving = input<boolean>(false);

  readonly featureDirtyChanged = output<void>();

  private readonly editableFeatures = signal<EditableFeature[]>([]);

  constructor() {
    effect(() => {
      const rawFeatures = this.features();
      this.populateFeatures(rawFeatures);
    });
  }

  getEditableFeatures(): EditableFeature[] {
    return this.editableFeatures();
  }

  getDirtyFeatures(): EditableFeature[] {
    return this.editableFeatures().filter(f => f.form.dirty);
  }

  buildFeaturePayload(feature: EditableFeature): FeatureUpdateRequest {
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

  toggleFeature(index: number): void {
    this.editableFeatures.update(features =>
      features.map((f, i) => i === index ? { ...f, expanded: !f.expanded } : f)
    );
  }

  private populateFeatures(rawFeatures: RawFeatureResponse[]): void {
    this.editableFeatures.set(
      rawFeatures.map(f => {
        const form = this.fb.nonNullable.group({
          name: [f.name],
          description: [f.description],
          featureType: [f.featureType],
        });
        form.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.featureDirtyChanged.emit();
          });
        return { id: f.id, pristine: { ...f }, form, expanded: false };
      })
    );
  }
}
