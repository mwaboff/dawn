import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModalShell } from '../../../../../../shared/components/modal-shell/modal-shell';
import { EntityFormField } from '../../../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { buildFormFromSchema, buildPayloadFromSchema } from '../../../../../../shared/components/entity-form/entity-form.utils';
import { ExperienceSelector } from '../../../../../../shared/components/experience-selector/experience-selector';
import { Experience } from '../../../../../../shared/models/experience.model';
import {
  CompanionApiResponse,
  CompanionDiceType,
  CompanionRange,
  CreateCompanionRequest,
  UpdateCompanionRequest,
} from '../../../../../../shared/models/companion-api.model';
import { COMPANION_FORM_DEFAULTS, COMPANION_FORM_SCHEMA } from './companion-form.schema';

export interface CompanionCreateSubmission {
  payload: CreateCompanionRequest;
  experiences: Experience[];
}

export interface CompanionUpdateSubmission {
  id: number;
  payload: UpdateCompanionRequest;
}

/**
 * Create/edit form for a companion's base stats, wrapping `ModalShell` + the shared
 * schema-driven entity form. Purely presentational -- like `transformation-panel`, it injects no
 * sheet state and makes no HTTP calls; the parent (`character-sheet.ts`) owns `CompanionService`
 * and orchestrates the actual create/update, including the follow-up Experience POSTs on create.
 * Like `transformation-panel`'s picker and `InventorySection`'s add panel, `companion-panel`
 * closes this modal optimistically the moment a submission is emitted rather than waiting on the
 * parent's HTTP result -- the established pattern across this sheet's mutations. On failure the
 * underlying data signal simply doesn't change, with no modal reopened, so this form has no
 * backend-error display; client-side schema validation is the only gate on `onSubmit()`.
 *
 * Create and edit intentionally build their payloads differently: edit reuses
 * `buildPayloadFromSchema`'s dirty-fields-only diffing (correct partial-PUT semantics), but
 * create sends every current form value regardless of dirty state -- an enum `<select>` a user
 * never touches stays at its pre-selected default and is never marked dirty, and `attackRange`/
 * `damageDice` are `@NotNull`-required with no server-side fallback (unlike `evasion`/
 * `stressMax`, which the service null-coalesces), so dirty-only submission would silently drop a
 * required field the form visibly filled in.
 */
@Component({
  selector: 'app-companion-form-modal',
  imports: [ReactiveFormsModule, ModalShell, EntityFormField, ExperienceSelector],
  templateUrl: './companion-form-modal.html',
  styleUrl: './companion-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly mode = input.required<'create' | 'edit'>();
  readonly characterSheetId = input.required<number>();
  readonly companion = input<CompanionApiResponse | null>(null);
  readonly processing = input(false);

  readonly dismissed = output<void>();
  readonly created = output<CompanionCreateSubmission>();
  readonly updated = output<CompanionUpdateSubmission>();

  readonly schema = COMPANION_FORM_SCHEMA;
  readonly submitted = signal(false);
  private readonly experiences = signal<Experience[]>([]);

  /** Built in `ngOnInit`, not the constructor: signal inputs bound by the parent (`mode`,
   * `companion`) aren't populated yet when the constructor runs -- only their `input()` default
   * applies at that point. `ngOnInit` runs after Angular's first change-detection pass has set
   * them, which is also when this modal's real caller (`companion-panel`, gating it behind
   * `@if`) has already fixed both for this instance's whole lifetime. */
  form!: FormGroup;
  readonly title = computed(() => (this.mode() === 'create' ? 'Add Companion' : 'Edit Companion'));

  ngOnInit(): void {
    this.form = buildFormFromSchema(this.schema, this.initialValues(), this.fb);
  }

  getControl(fieldName: string) {
    return this.form.get(fieldName)!;
  }

  onExperiencesChanged(list: Experience[]): void {
    this.experiences.set(list);
  }

  onDismiss(): void {
    if (!this.processing()) this.dismissed.emit();
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    if (this.mode() === 'create') {
      const raw = this.form.getRawValue();
      this.created.emit({
        payload: {
          characterSheetId: this.characterSheetId(),
          name: raw['name'],
          description: raw['description'] || undefined,
          evasion: raw['evasion'],
          attackName: raw['attackName'],
          attackRange: raw['attackRange'] as CompanionRange,
          damageDice: raw['damageDice'] as CompanionDiceType,
          stressMax: raw['stressMax'],
        },
        experiences: this.experiences(),
      });
      return;
    }

    const id = this.companion()?.id;
    if (id == null) return;
    this.updated.emit({ id, payload: buildPayloadFromSchema(this.schema, this.form) as UpdateCompanionRequest });
  }

  private initialValues(): Record<string, unknown> {
    const c = this.companion();
    if (!c) return COMPANION_FORM_DEFAULTS;
    return {
      name: c.name,
      description: c.description ?? '',
      evasion: c.baseEvasion,
      attackName: c.attackName,
      attackRange: c.baseAttackRange,
      damageDice: c.baseDamageDice,
      stressMax: c.baseStressMax,
    };
  }
}
