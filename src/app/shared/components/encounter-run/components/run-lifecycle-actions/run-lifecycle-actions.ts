import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, tap } from 'rxjs';

import { EncounterRunService } from '../../../../services/encounter-run.service';
import { ConfirmDialog } from '../../../confirm-dialog/confirm-dialog';

/**
 * Ends the run, one way or the other: Complete (POST .../complete) or Discard (a confirmed hard
 * DELETE). Self-contained on purpose -- unlike the per-adversary mutations in `EncounterRunView`,
 * these two actions don't touch `runState.adversaries` at all, so they get their own
 * completing/discarding state and their own inline error rather than sharing the row-mutation
 * machinery they have nothing in common with.
 */
@Component({
  selector: 'app-run-lifecycle-actions',
  templateUrl: './run-lifecycle-actions.html',
  styleUrl: './run-lifecycle-actions.css',
  imports: [ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunLifecycleActions {
  private readonly runService = inject(EncounterRunService);
  private readonly destroyRef = inject(DestroyRef);

  readonly runId = input.required<number>();
  /** Fired after either a successful complete or a successful discard -- from the host's
   * perspective the run is equally over either way. */
  readonly completed = output<void>();

  readonly completing = signal(false);
  readonly discardPending = signal(false);
  readonly discarding = signal(false);
  readonly error = signal<string | null>(null);

  onComplete(): void {
    if (this.completing()) return;

    this.completing.set(true);
    this.error.set(null);

    this.runService
      .completeRun(this.runId())
      .pipe(
        tap(() => {
          this.completing.set(false);
          this.completed.emit();
        }),
        catchError(() => {
          this.completing.set(false);
          this.error.set("Couldn't complete the encounter — try again.");
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  requestDiscard(): void {
    this.discardPending.set(true);
  }

  cancelDiscard(): void {
    this.discardPending.set(false);
  }

  confirmDiscard(): void {
    this.discarding.set(true);
    this.error.set(null);

    this.runService
      .deleteRun(this.runId())
      .pipe(
        tap(() => {
          this.discarding.set(false);
          this.discardPending.set(false);
          this.completed.emit();
        }),
        catchError(() => {
          this.discarding.set(false);
          // Closes the dialog rather than leaving it open -- the error banner below renders in
          // the base layout, which the still-open modal backdrop would otherwise cover.
          this.discardPending.set(false);
          this.error.set("Couldn't discard the run — try again.");
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
