import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  CompanionExperienceApiResponse,
  CompanionTrainingApiResponse,
  CompanionTrainingOption,
  CreateCompanionTrainingRequest,
  ViciousAxis,
} from '../../../../../../shared/models/companion-api.model';
import { COMPANION_TRAINING_LABELS, COMPANION_TRAINING_OPTIONS } from './companion-training-list.model';

/**
 * The 8 Training options, each showing its remaining-selections count and a "Take" action, plus
 * the list of already-taken selections with a remove action. `VICIOUS` and `INTELLIGENT` need a
 * sub-choice (which ladder / which Experience) before the take can be submitted -- tracked as
 * local, presentational-only state (`pendingOption` etc.), never persisted here. The parent owns
 * the actual `CompanionService.addTraining`/`removeTraining` calls.
 */
@Component({
  selector: 'app-companion-training-list',
  templateUrl: './companion-training-list.html',
  styleUrl: './companion-training-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionTrainingList {
  readonly trainings = input.required<CompanionTrainingApiResponse[]>();
  readonly remainingByOption = input.required<Partial<Record<CompanionTrainingOption, number>>>();
  readonly experiences = input<CompanionExperienceApiResponse[]>([]);
  readonly canManage = input(false);
  readonly processing = input(false);

  readonly trainingAdded = output<CreateCompanionTrainingRequest>();
  readonly trainingRemoved = output<number>();

  readonly options = COMPANION_TRAINING_OPTIONS;
  readonly trainingLabels = COMPANION_TRAINING_LABELS;

  readonly pendingOption = signal<CompanionTrainingOption | null>(null);

  remainingFor(option: CompanionTrainingOption): number {
    return this.remainingByOption()[option] ?? 0;
  }

  canTake(option: CompanionTrainingOption): boolean {
    return this.canManage() && !this.processing() && this.remainingFor(option) > 0;
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
    this.trainingAdded.emit({ option });
  }

  onViciousAxisChosen(axis: ViciousAxis): void {
    this.trainingAdded.emit({ option: 'VICIOUS', viciousAxis: axis });
    this.pendingOption.set(null);
  }

  onExperienceChosen(targetExperienceId: number): void {
    this.trainingAdded.emit({ option: 'INTELLIGENT', targetExperienceId });
    this.pendingOption.set(null);
  }

  onCancelPending(): void {
    this.pendingOption.set(null);
  }

  onRemove(trainingId: number): void {
    if (!this.canManage() || this.processing()) return;
    this.trainingRemoved.emit(trainingId);
  }
}
