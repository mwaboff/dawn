import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import {
  DEFAULT_EXPERIENCE_MODIFIER,
  EXPERIENCE_NAME_PATTERN,
  MAX_EXPERIENCE_NAME_LENGTH,
  sanitizeExperienceName,
} from '../../models/experience.model';

/** A companion always starts with exactly two Experiences, both fixed at +2 (core-01:1319:
 * "Create two Experiences… Start with +2 in both"). Unlike a character's own Experiences, the
 * player names these but never sets their modifier. */
export const STARTING_COMPANION_EXPERIENCE_COUNT = 2;

/** The blank starting pair, for a caller that has no prior names to restore. */
export function emptyCompanionExperienceNames(): string[] {
  return Array.from({ length: STARTING_COMPANION_EXPERIENCE_COUNT }, () => '');
}

/**
 * The name-only rows for a companion's starting Experiences, with the modifier rendered as fixed
 * text rather than an input.
 *
 * Deliberately NOT the shared `ExperienceSelector`: that component lets the player add/remove rows
 * (1-5) and freely set each modifier, which is correct for a *character's* Experiences but wrong
 * for a companion's. Rather than bolt a narrow "fixed count, fixed modifier" mode onto it, this
 * renders the companion shape on its own, leaving `ExperienceSelector` to the character's own
 * Experiences (`create-character`'s Experiences step).
 *
 * Fully controlled: the caller owns the name list and this emits the next one, so the same rows
 * serve both a live-emitting wizard step (`CompanionCreator`) and a submit-gated dialog
 * (`CompanionFormModal`).
 */
@Component({
  selector: 'app-companion-experience-rows',
  templateUrl: './companion-experience-rows.html',
  styleUrl: './companion-experience-rows.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionExperienceRows {
  readonly names = input.required<string[]>();

  readonly namesChanged = output<string[]>();

  readonly nameMaxLength = MAX_EXPERIENCE_NAME_LENGTH;
  readonly modifier = DEFAULT_EXPERIENCE_MODIFIER;
  readonly nameError = signal<string | null>(null);

  onNameChange(index: number, event: Event): void {
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
    this.namesChanged.emit(this.names().map((name, i) => (i === index ? sanitized : name)));
  }
}
