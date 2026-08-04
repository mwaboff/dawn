import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { EntityFormField } from '../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { buildFormFromSchema } from '../../../../shared/components/entity-form/entity-form.utils';
import { ExperienceSelector } from '../../../../shared/components/experience-selector/experience-selector';
import { Experience, createDefaultExperiences } from '../../../../shared/models/experience.model';
import { CompanionDiceType, CompanionRange } from '../../../../shared/models/companion-api.model';
import {
  COMPANION_FORM_DEFAULTS,
  COMPANION_FORM_SCHEMA,
} from '../../../character-sheet/components/companion-panel/components/companion-form-modal/companion-form.schema';
import { CompanionDraft } from '../../models/companion-draft.model';

/**
 * Character-creation step for the Beastbound Ranger's "Companion" foundation feature. Reuses
 * `COMPANION_FORM_SCHEMA` -- the same schema `CompanionFormModal` uses to edit a companion from
 * the character sheet -- so there is exactly one shape for "the fields that make a companion",
 * not a second copy that could drift from it.
 *
 * Per companions plan §1/§6.5, taking a companion is "at the GM's discretion": this step is
 * always skippable, and a Beastbound player who skips it can still create one later from the
 * character sheet. The toggle below defaults off. Unlike `CompanionFormModal`, there is no submit
 * button here -- this is one step of a multi-step wizard, not a dialog -- so every change
 * (toggle, field edit, experience edit) emits immediately via `draftChanged`, live, the same way
 * every other creation step (`TraitSelector`, `WeaponSection`, ...) reports its state to
 * `CreateCharacter` as the player edits it rather than on an explicit submit.
 *
 * The emitted draft is NOT gated on form validity -- an incomplete draft (e.g. name typed but
 * attack name still blank) is emitted as-is so navigating away and back (which destroys and
 * recreates this component, per the wizard's `@switch`) can restore it via `initialDraft` without
 * losing partially-entered work. `CreateCharacter.isCompanionDraftReady` is what decides at
 * submit time whether a draft is complete enough to actually create.
 */
@Component({
  selector: 'app-companion-creator',
  imports: [ReactiveFormsModule, EntityFormField, ExperienceSelector],
  templateUrl: './companion-creator.html',
  styleUrl: './companion-creator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionCreator implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly initialDraft = input<CompanionDraft | null>(null);
  readonly draftChanged = output<CompanionDraft | null>();

  readonly schema = COMPANION_FORM_SCHEMA;
  readonly wantsCompanion = signal(false);

  private readonly experiences = signal<Experience[]>(createDefaultExperiences());

  form!: FormGroup;

  ngOnInit(): void {
    const draft = this.initialDraft();
    this.form = buildFormFromSchema(this.schema, draft ? this.toRawValues(draft) : COMPANION_FORM_DEFAULTS, this.fb);

    if (draft) {
      this.wantsCompanion.set(true);
      this.experiences.set(draft.experiences);
    }

    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  getControl(fieldName: string) {
    return this.form.get(fieldName)!;
  }

  onToggleChanged(event: Event): void {
    this.wantsCompanion.set((event.target as HTMLInputElement).checked);
    this.emitChange();
  }

  onExperiencesChanged(list: Experience[]): void {
    this.experiences.set(list);
    this.emitChange();
  }

  private emitChange(): void {
    if (!this.wantsCompanion()) {
      this.draftChanged.emit(null);
      return;
    }

    const raw = this.form.getRawValue();
    this.draftChanged.emit({
      payload: {
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
  }

  private toRawValues(draft: CompanionDraft): Record<string, unknown> {
    return {
      name: draft.payload.name,
      description: draft.payload.description ?? '',
      evasion: draft.payload.evasion,
      attackName: draft.payload.attackName,
      attackRange: draft.payload.attackRange,
      damageDice: draft.payload.damageDice,
      stressMax: draft.payload.stressMax,
    };
  }
}
