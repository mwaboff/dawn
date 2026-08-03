import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { EncounterResponse } from '../../../../../../../shared/models/encounter-api.model';

/**
 * One saved encounter in the panel's list: its name, tier, Battle Point spend, and the button
 * that starts (or resumes) a run for it. No fight logic here -- see `EncounterRunView` for that.
 */
@Component({
  selector: 'app-panel-encounter-row',
  templateUrl: './panel-encounter-row.html',
  styleUrl: './panel-encounter-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelEncounterRow {
  readonly encounter = input.required<EncounterResponse>();
  /** True when this encounter already has an ACTIVE run tagged to the campaign. */
  readonly resuming = input(false);
  /** True while this row's own start-run request is in flight. */
  readonly starting = input(false);

  readonly run = output<void>();

  readonly tierLabel = computed(() => {
    const { tier } = this.encounter();
    return tier === undefined ? 'Multi-tier' : `Tier ${tier}`;
  });

  readonly actionLabel = computed(() => {
    if (this.starting()) return 'Starting…';
    return this.resuming() ? 'Resume' : 'Run';
  });
}
