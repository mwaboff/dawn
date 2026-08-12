import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RestOutcome } from '../../models/rest.model';

@Component({
  selector: 'app-rest-summary-step',
  templateUrl: './rest-summary-step.html',
  styleUrls: ['../../rest-step.css', './rest-summary-step.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestSummaryStep {
  readonly outcome = input.required<RestOutcome>();
  /**
   * True when a companion write from this rest failed. The summary lines below describe what the
   * rest resolved, not what persisted, so without this the step would claim a companion clear that
   * was rolled back -- the sheet's own companion banner sits behind this modal.
   */
  readonly companionSaveFailed = input(false);
}
