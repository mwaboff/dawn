import { Component, input, output, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CompanionExperienceGrant } from '../../models/level-up-api.model';

/** A companion eligible for this level-up's automatic Experience grant -- see `TierAchievementsStep`. */
export interface CompanionExperienceTarget {
  companionId: number;
  name: string;
}

@Component({
  selector: 'app-tier-achievements-step',
  templateUrl: './tier-achievements-step.html',
  styleUrl: './tier-achievements-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierAchievementsStep implements OnInit {
  readonly nextLevel = input.required<number>();
  readonly currentTier = input.required<number>();
  readonly nextTier = input.required<number>();
  readonly initialDescription = input<string>('');
  /** Companions that also gain a new Experience this level-up ("Whenever you gain a new
   * Experience, your companion also gains one" -- companions plan §3.2). One input row per
   * target, beside the character's own. */
  readonly companionExperienceTargets = input<CompanionExperienceTarget[]>([]);
  readonly initialCompanionExperiences = input<CompanionExperienceGrant[]>([]);

  readonly experienceDescriptionChanged = output<string>();
  readonly companionExperiencesChanged = output<CompanionExperienceGrant[]>();

  readonly description = signal('');
  readonly companionDescriptions = signal<Record<number, string>>({});

  ngOnInit(): void {
    if (this.initialDescription()) {
      this.description.set(this.initialDescription());
    }
    if (this.initialCompanionExperiences().length > 0) {
      const seeded: Record<number, string> = {};
      for (const grant of this.initialCompanionExperiences()) {
        seeded[grant.companionId] = grant.description;
      }
      this.companionDescriptions.set(seeded);
    }
  }

  readonly clearsMarkedTraits = (() => {
    return [5, 8];
  })();

  onDescriptionInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.description.set(value);
    this.experienceDescriptionChanged.emit(value);
  }

  companionDescriptionFor(companionId: number): string {
    return this.companionDescriptions()[companionId] ?? '';
  }

  onCompanionDescriptionInput(companionId: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.companionDescriptions.update(current => ({ ...current, [companionId]: value }));
    this.companionExperiencesChanged.emit(
      this.companionExperienceTargets().map(t => ({ companionId: t.companionId, description: this.companionDescriptionFor(t.companionId) })),
    );
  }
}
