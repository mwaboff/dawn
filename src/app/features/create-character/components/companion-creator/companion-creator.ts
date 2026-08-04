import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { EntityFormField } from '../../../../shared/components/entity-form/entity-form-field/entity-form-field';
import { buildFormFromSchema } from '../../../../shared/components/entity-form/entity-form.utils';
import {
  DEFAULT_EXPERIENCE_MODIFIER,
  Experience,
  EXPERIENCE_NAME_PATTERN,
  MAX_EXPERIENCE_NAME_LENGTH,
  sanitizeExperienceName,
} from '../../../../shared/models/experience.model';
import { CompanionDiceType, CompanionRange } from '../../../../shared/models/companion-api.model';
import {
  COMPANION_FORM_DEFAULTS,
  COMPANION_FORM_SCHEMA,
} from '../../../character-sheet/components/companion-panel/components/companion-form-modal/companion-form.schema';
import { CompanionDraft } from '../../models/companion-draft.model';

/** A companion always starts with exactly two Experiences, both fixed at +2 (core-01:1319:
 * "Create two Experiences… Start with +2 in both"). Unlike a character's own Experiences, the
 * player names these but never sets their modifier. */
const STARTING_EXPERIENCE_COUNT = 2;

/**
 * Character-creation step for the Beastbound Ranger's "Companion" foundation feature. Reuses
 * `COMPANION_FORM_SCHEMA` -- the same schema `CompanionFormModal` uses to edit a companion from
 * the character sheet -- so there is exactly one shape for "the fields that make a companion",
 * not a second copy that could drift from it.
 *
 * Its two starting Experiences are deliberately NOT built with the shared `ExperienceSelector`:
 * that component lets the player add/remove rows (1-5) and freely set each modifier, which is
 * correct for a *character's* Experiences but wrong here -- a companion always gets exactly two,
 * both fixed at +2, never player-chosen (core-01:1319). Rather than bolt a narrow "fixed count,
 * fixed modifier" mode onto a component with four other call sites, this step renders its own pair
 * of name-only inputs and hardcodes the modifier, so `ExperienceSelector`'s behavior for every
 * other consumer is untouched.
 *
 * Per companions plan §1/§6.5, taking a companion is "at the GM's discretion": this step is
 * always skippable, and a Beastbound player who skips it can still create one later from the
 * character sheet. The toggle below defaults off. Unlike `CompanionFormModal`, there is no submit
 * button here -- this is one step of a multi-step wizard, not a dialog -- so every change
 * (toggle, field edit, experience name edit) emits immediately via `draftChanged`, live, the same
 * way every other creation step (`TraitSelector`, `WeaponSection`, ...) reports its state to
 * `CreateCharacter` as the player edits it rather than on an explicit submit.
 *
 * The emitted draft is NOT gated on form validity -- an incomplete draft (e.g. name typed but
 * attack name still blank) is emitted as-is so navigating away and back (which destroys and
 * recreates this component, per the wizard's `@switch`) can restore it via `initialDraft` without
 * losing partially-entered work. `isCompanionDraftReady` (`utils/companion-draft.utils.ts`) is
 * what decides at submit/review time whether a draft is complete enough to actually create --
 * including that BOTH Experience names are filled in, so a companion is never silently created
 * with zero (or one) Experience.
 */
@Component({
  selector: 'app-companion-creator',
  imports: [ReactiveFormsModule, EntityFormField],
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
  readonly experienceNameMaxLength = MAX_EXPERIENCE_NAME_LENGTH;

  private readonly experienceNames = signal<string[]>(['', '']);
  readonly experienceNameList = this.experienceNames.asReadonly();
  readonly nameError = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    const draft = this.initialDraft();
    this.form = buildFormFromSchema(this.schema, draft ? this.toRawValues(draft) : COMPANION_FORM_DEFAULTS, this.fb);

    if (draft) {
      this.wantsCompanion.set(true);
      this.experienceNames.set(this.toExperienceNames(draft.experiences));
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

  onExperienceNameChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizeExperienceName(input.value);
    this.nameError.set(
      EXPERIENCE_NAME_PATTERN.test(input.value)
        ? null
        : 'Only letters, numbers, spaces, hyphens, and apostrophes are allowed',
    );
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    const updated = this.experienceNames().map((name, i) => (i === index ? sanitized : name));
    this.experienceNames.set(updated);
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
      experiences: this.experienceNames().map(
        (name): Experience => ({ name, modifier: DEFAULT_EXPERIENCE_MODIFIER }),
      ),
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

  private toExperienceNames(experiences: Experience[]): string[] {
    const names = experiences.map(exp => exp.name);
    return Array.from({ length: STARTING_EXPERIENCE_COUNT }, (_, i) => names[i] ?? '');
  }
}
