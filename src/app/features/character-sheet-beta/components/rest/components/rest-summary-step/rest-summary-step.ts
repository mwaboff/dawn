import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RestOutcome } from '../../models/rest.model';

@Component({
  selector: 'app-rest-summary-step',
  templateUrl: './rest-summary-step.html',
  styleUrls: ['../../rest-step.css', './rest-summary-step.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestSummaryStep {
  readonly outcome = input.required<RestOutcome>();

  protected readonly heading = computed(() =>
    this.outcome().restType === 'short' ? 'Short rest' : 'Long rest',
  );
}
