import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { KeyValuePipe } from '@angular/common';

import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { TraitAssignments, TRAITS } from '../../models/trait.model';
import { Experience } from '../../models/experience.model';
import { DEFAULT_MAJOR_THRESHOLD, DEFAULT_SEVERE_THRESHOLD } from '../../models/character-sheet.model';
import { calculateDisplayEvasion } from '../../utils/stat-calculator.utils';
import { SubmitError } from '../../models/submit-error.model';

@Component({
  selector: 'app-review-section',
  imports: [KeyValuePipe],
  templateUrl: './review-section.html',
  styleUrl: './review-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewSection {
  readonly classCard = input.required<CardData>();
  readonly subclassCard = input.required<CardData>();
  readonly ancestryCard = input.required<CardData>();
  readonly communityCard = input.required<CardData>();
  readonly traits = input.required<TraitAssignments>();
  readonly primaryWeapon = input<CardData | null>(null);
  readonly secondaryWeapon = input<CardData | null>(null);
  readonly armor = input<CardData | null>(null);
  readonly experiences = input.required<Experience[]>();
  readonly domainCards = input.required<CardData[]>();

  readonly submitClicked = output<void>();
  readonly submitting = input<boolean>(false);
  readonly submitError = input<SubmitError | null>(null);

  readonly traitList = TRAITS;

  readonly baseEvasion = computed(
    () => (this.classCard().metadata?.['startingEvasion'] as number) ?? 0,
  );

  readonly displayEvasion = computed(() =>
    calculateDisplayEvasion(
      this.baseEvasion(),
      this.armor(),
      this.primaryWeapon(),
      this.secondaryWeapon(),
    ),
  );

  readonly hitPointMax = computed(
    () => (this.classCard().metadata?.['startingHitPoints'] as number) ?? 0,
  );

  readonly armorMax = computed(
    () => (this.armor()?.metadata?.['baseScore'] as number) ?? 0,
  );

  readonly majorDamageThreshold = computed(() => {
    const armor = this.armor();
    return armor
      ? ((armor.metadata?.['baseMajorThreshold'] as number) ?? DEFAULT_MAJOR_THRESHOLD)
      : DEFAULT_MAJOR_THRESHOLD;
  });

  readonly severeDamageThreshold = computed(() => {
    const armor = this.armor();
    return armor
      ? ((armor.metadata?.['baseSevereThreshold'] as number) ?? DEFAULT_SEVERE_THRESHOLD)
      : DEFAULT_SEVERE_THRESHOLD;
  });

  readonly completedExperiences = computed(() =>
    this.experiences().filter((exp) => exp.name.trim() !== '' && exp.modifier !== null),
  );

  formatModifier(value: number | null): string {
    if (value === null) return '—';
    return value >= 0 ? `+${value}` : `${value}`;
  }
}
