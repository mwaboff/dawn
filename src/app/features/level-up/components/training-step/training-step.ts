import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CompanionTrainingOption, ViciousAxis } from '../../../../shared/models/companion-api.model';
import { titleCase } from '../../../../shared/utils/text.utils';
import { CompanionTrainingEligibility, CompanionTrainingSelection } from '../../models/level-up-api.model';
import { COMPANION_TRAINING_LABELS, COMPANION_TRAINING_OPTIONS } from '../../../character-sheet/components/companion-panel/components/companion-training-list/companion-training-list.model';

const DAMAGE_TYPE_CODES: Record<string, string> = { PHYSICAL: 'phy', MAGIC: 'mag' };

/**
 * One companion's Training picks for this level-up. Rendered ONCE per eligible companion via
 * `[companionId]`/`[training]` bindings (`level-up.html`'s single `@case ('training')`), never
 * one `@switch` case per companion -- `level-up.ts` looks the matching `CompanionTrainingEligibility`
 * entry up from `levelUpOptions().companionTraining` by the active tab's `companionId`.
 *
 * Reuses the option metadata (`COMPANION_TRAINING_OPTIONS`/`COMPANION_TRAINING_LABELS`) from the
 * character sheet's `CompanionTrainingList` -- the same domain data (the printed sheet's 8
 * Training options), not a level-up-local copy. NOT that component itself, though: its
 * interaction model fires one real `CompanionService.addTraining` call per pick, capped only by
 * the companion's all-time `remainingByOption`. This step stages picks locally (nothing is sent
 * until the wizard's own submit) and caps them by BOTH `remaining` (all-time, from the server)
 * AND `picksAvailable` (this level-up's budget -- see `companionTrainingBonusPicks` for how that
 * reactively includes Expert/Advanced Training's bonus picks).
 */
@Component({
  selector: 'app-training-step',
  templateUrl: './training-step.html',
  styleUrl: './training-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingStep {
  readonly training = input.required<CompanionTrainingEligibility>();
  readonly picksAvailable = input.required<number>();
  readonly selections = input<CompanionTrainingSelection[]>([]);

  readonly selectionsChanged = output<CompanionTrainingSelection[]>();

  readonly options = COMPANION_TRAINING_OPTIONS;
  readonly trainingLabels = COMPANION_TRAINING_LABELS;

  readonly pendingOption = signal<CompanionTrainingOption | null>(null);

  readonly stats = computed(() => this.training().currentStats);
  readonly selectionCount = computed(() => this.selections().length);
  readonly isComplete = computed(() => this.selectionCount() === this.picksAvailable());
  readonly hasExperiences = computed(() => (this.stats().experiences ?? []).length > 0);

  readonly attackLine = computed(() => {
    const s = this.stats();
    const die = s.damageDice.toLowerCase();
    const dmg = DAMAGE_TYPE_CODES[s.damageType] ?? s.damageType.toLowerCase();
    return `${s.attackDiceCount}${die} ${dmg} at ${titleCase(s.attackRange)}`;
  });

  private serverRemaining(option: CompanionTrainingOption): number {
    return this.training().availableOptions.find(o => o.option === option)?.remaining ?? 0;
  }

  private takenThisLevelUp(option: CompanionTrainingOption): number {
    return this.selections().filter(s => s.option === option).length;
  }

  remainingFor(option: CompanionTrainingOption): number {
    return Math.max(0, this.serverRemaining(option) - this.takenThisLevelUp(option));
  }

  isViciousAxisCapped(axis: ViciousAxis): boolean {
    const stats = this.stats();
    return axis === 'DAMAGE_DIE' ? stats.damageDice === 'D12' : stats.attackRange === 'VERY_FAR';
  }

  /** VICIOUS is only fully exhausted once BOTH axes are capped -- one maxed axis still leaves the
   * other pickable. */
  isViciousExhausted(): boolean {
    return this.isViciousAxisCapped('DAMAGE_DIE') && this.isViciousAxisCapped('RANGE');
  }

  canTake(option: CompanionTrainingOption): boolean {
    if (this.selectionCount() >= this.picksAvailable()) return false;
    if (this.remainingFor(option) === 0) return false;
    if (option === 'VICIOUS') return !this.isViciousExhausted();
    if (option === 'INTELLIGENT') return this.hasExperiences();
    return true;
  }

  needsSubChoice(option: CompanionTrainingOption): boolean {
    return option === 'VICIOUS' || option === 'INTELLIGENT';
  }

  onTakeClicked(option: CompanionTrainingOption): void {
    if (!this.canTake(option)) return;
    if (this.needsSubChoice(option)) {
      this.pendingOption.set(option);
      return;
    }
    this.addSelection({ companionId: this.training().companionId, option });
  }

  onViciousAxisChosen(axis: ViciousAxis): void {
    if (this.isViciousAxisCapped(axis)) return;
    this.addSelection({ companionId: this.training().companionId, option: 'VICIOUS', viciousAxis: axis });
    this.pendingOption.set(null);
  }

  onExperienceChosen(targetExperienceId: number): void {
    this.addSelection({ companionId: this.training().companionId, option: 'INTELLIGENT', targetExperienceId });
    this.pendingOption.set(null);
  }

  onCancelPending(): void {
    this.pendingOption.set(null);
  }

  onRemove(index: number): void {
    this.selectionsChanged.emit(this.selections().filter((_, i) => i !== index));
  }

  private addSelection(selection: CompanionTrainingSelection): void {
    this.selectionsChanged.emit([...this.selections(), selection]);
  }
}
