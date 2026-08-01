import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  COUNTDOWN_LOOP_OPTIONS,
  COUNTDOWN_TYPE_OPTIONS,
  CountdownResponse,
} from '../../../../../../../shared/models/countdown-api.model';
import { InlineDeleteConfirm } from '../../../../../../../shared/components/inline-delete-confirm/inline-delete-confirm';

/**
 * One countdown: its remaining segments, tick controls, and the trigger line telling the GM
 * when this kind of countdown advances.
 *
 * The trigger line is the point of the panel -- a GM who cannot remember the Dynamic Countdown
 * Advancement table should not have to leave the row to look it up.
 */
@Component({
  selector: 'app-countdown-row',
  templateUrl: './countdown-row.html',
  styleUrl: './countdown-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InlineDeleteConfirm],
})
export class CountdownRow {
  readonly countdown = input.required<CountdownResponse>();
  readonly deletePending = input(false);

  readonly tick = output<number>();
  readonly deleteRequested = output<void>();
  readonly deleteConfirmed = output<void>();
  readonly deleteCancelled = output<void>();

  /** Filled segments render solid, spent segments hollow. */
  readonly segments = computed(() => {
    const { startingValue, currentValue } = this.countdown();
    return Array.from({ length: startingValue }, (_, index) => index < currentValue);
  });

  readonly typeLabel = computed(
    () => COUNTDOWN_TYPE_OPTIONS.find(option => option.value === this.countdown().type)?.label ?? '',
  );

  readonly trigger = computed(
    () => COUNTDOWN_TYPE_OPTIONS.find(option => option.value === this.countdown().type)?.trigger ?? '',
  );

  /** Only shown when the countdown actually loops, so a plain countdown stays uncluttered. */
  readonly loopLabel = computed(() => {
    const { loopBehavior } = this.countdown();
    if (loopBehavior === 'NONE') return '';
    return COUNTDOWN_LOOP_OPTIONS.find(option => option.value === loopBehavior)?.label ?? '';
  });

  readonly atZero = computed(() => this.countdown().currentValue === 0);
  readonly atStart = computed(() => this.countdown().currentValue === this.countdown().startingValue);

  onTickDown(): void {
    this.tick.emit(this.countdown().currentValue - 1);
  }

  onTickUp(): void {
    this.tick.emit(this.countdown().currentValue + 1);
  }
}
