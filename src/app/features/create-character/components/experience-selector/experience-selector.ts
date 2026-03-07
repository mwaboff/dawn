import { Component, signal, computed, output, input, effect, ChangeDetectionStrategy } from '@angular/core';

import {
  Experience,
  DEFAULT_EXPERIENCE_MODIFIER,
  EXPERIENCE_NAME_PATTERN,
  MAX_EXPERIENCE_COUNT,
  MIN_EXPERIENCE_COUNT,
  createDefaultExperiences,
  createEmptyExperience,
  isExperienceComplete,
  sanitizeExperienceName,
  clampModifier,
} from '../../models/experience.model';

@Component({
  selector: 'app-experience-selector',
  templateUrl: './experience-selector.html',
  styleUrl: './experience-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSelector {
  readonly initialExperiences = input<Experience[]>();
  readonly experiencesChanged = output<Experience[]>();

  private readonly experiences = signal<Experience[]>(createDefaultExperiences());

  constructor() {
    effect(() => {
      const initial = this.initialExperiences();
      if (initial && initial.length > 0) {
        this.experiences.set(initial);
      }
    });
  }

  readonly experienceList = this.experiences.asReadonly();

  readonly isComplete = computed(() =>
    this.experiences().some(exp => isExperienceComplete(exp)),
  );

  readonly canAddMore = computed(() =>
    this.experiences().length < MAX_EXPERIENCE_COUNT,
  );

  readonly canRemove = computed(() =>
    this.experiences().length > MIN_EXPERIENCE_COUNT,
  );

  readonly completeCount = computed(() =>
    this.experiences().filter(exp => isExperienceComplete(exp)).length,
  );

  readonly nameError = signal<string | null>(null);

  onNameChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizeExperienceName(input.value);
    if (!EXPERIENCE_NAME_PATTERN.test(input.value)) {
      this.nameError.set('Only letters, numbers, spaces, hyphens, and apostrophes are allowed');
    } else {
      this.nameError.set(null);
    }
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    const updated = this.experiences().map((exp, i) => {
      if (i !== index) return exp;
      const modifier = sanitized.trim() && exp.modifier === null ? DEFAULT_EXPERIENCE_MODIFIER : exp.modifier;
      return { ...exp, name: sanitized, modifier };
    });
    this.experiences.set(updated);
    this.emitChange();
  }

  onModifierChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const parsed = raw === '' ? null : parseInt(raw, 10);
    const value = parsed === null || isNaN(parsed) ? null : clampModifier(parsed);
    if (value !== null && value !== parsed) {
      input.value = String(value);
    }
    const updated = this.experiences().map((exp, i) =>
      i === index ? { ...exp, modifier: value } : exp,
    );
    this.experiences.set(updated);
    this.emitChange();
  }

  onAddExperience(): void {
    if (!this.canAddMore()) return;
    this.experiences.set([...this.experiences(), createEmptyExperience()]);
    this.emitChange();
  }

  onRemoveExperience(index: number): void {
    if (!this.canRemove()) return;
    this.experiences.set(this.experiences().filter((_, i) => i !== index));
    this.emitChange();
  }

  private emitChange(): void {
    this.experiencesChanged.emit(this.experiences());
  }
}
