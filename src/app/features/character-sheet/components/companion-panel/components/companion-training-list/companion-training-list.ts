import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CompanionTrainingApiResponse } from '../../../../../../shared/models/companion-api.model';
import { COMPANION_TRAINING_LABELS, VICIOUS_AXIS_LABELS } from './companion-training-list.model';

/**
 * Read-only record of the Training options a companion has already taken.
 *
 * Taking a Training is a level-up choice, so it belongs to the level-up wizard's `TrainingStep`
 * and nowhere else -- the sheet shows what the companion has, the way it shows the rest of an
 * already-made character. Removing one is likewise not a sheet action: an unpick would have to
 * give the level-up budget back, which only the wizard tracks.
 */
@Component({
  selector: 'app-companion-training-list',
  templateUrl: './companion-training-list.html',
  styleUrl: './companion-training-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionTrainingList {
  readonly trainings = input.required<CompanionTrainingApiResponse[]>();

  readonly trainingLabels = COMPANION_TRAINING_LABELS;
  readonly axisLabels = VICIOUS_AXIS_LABELS;
}
