import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, tap } from 'rxjs';

import {
  COUNTDOWN_LOOP_OPTIONS,
  COUNTDOWN_TYPE_OPTIONS,
  CountdownResponse,
} from '../../../../../shared/models/countdown-api.model';
import { CountdownService } from '../../../../../shared/services/countdown.service';
import { GmScreenContext } from '../../gm-screen-context.service';
import { CountdownHelp } from './components/countdown-help/countdown-help';
import { CountdownRow } from './components/countdown-row/countdown-row';

/**
 * The campaign's countdown tracker.
 *
 * Owns the list and the add form; a single countdown's controls live in {@link CountdownRow} and
 * the rules reference in {@link CountdownHelp}. Ticking is optimistic and rolls back on failure, following
 * `FearCounterPanel` -- the difference is that the server may answer a tick to 0 with a looped
 * value, so the response replaces the row rather than merely confirming it.
 */
@Component({
  selector: 'app-countdowns-panel',
  templateUrl: './countdowns-panel.html',
  styleUrl: './countdowns-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CountdownRow, CountdownHelp],
})
export class CountdownsPanel {
  private readonly context = inject(GmScreenContext);
  private readonly countdownService = inject(CountdownService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly typeOptions = COUNTDOWN_TYPE_OPTIONS;
  readonly loopOptions = COUNTDOWN_LOOP_OPTIONS;

  private readonly countdownList = signal<readonly CountdownResponse[]>([]);
  readonly countdowns = computed(() => this.countdownList());

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly adding = signal(false);
  readonly addFormOpen = signal(false);
  readonly pendingDeleteId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['STANDARD' as const, [Validators.required]],
    loopBehavior: ['NONE' as const, [Validators.required]],
    startingValue: [4, [Validators.required, Validators.min(1), Validators.max(99)]],
  });

  constructor() {
    effect(() => {
      const campaignId = this.context.campaignId();
      untracked(() => this.load(campaignId));
    });
  }

  toggleAddForm(): void {
    this.addFormOpen.update(open => !open);
  }

  onDeleteRequested(id: number): void {
    this.pendingDeleteId.set(id);
  }

  onDeleteCancelled(): void {
    this.pendingDeleteId.set(null);
  }

  /**
   * Writes the new value locally, then persists it. A tick that reaches 0 may come back looped,
   * so the server's row replaces the optimistic one on success.
   */
  onTick(countdown: CountdownResponse, nextValue: number): void {
    const clamped = Math.min(countdown.startingValue, Math.max(0, nextValue));
    if (clamped === countdown.currentValue) return;

    const snapshot = countdown;
    this.replaceRow({ ...countdown, currentValue: clamped });

    this.countdownService
      .updateCountdownValue(countdown.id, clamped)
      .pipe(
        tap(saved => this.replaceRow(saved)),
        catchError(() => {
          this.replaceRow(snapshot);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onDeleteConfirmed(countdown: CountdownResponse): void {
    const snapshot = this.countdownList();
    this.pendingDeleteId.set(null);
    this.countdownList.set(snapshot.filter(item => item.id !== countdown.id));

    this.countdownService
      .deleteCountdown(countdown.id)
      .pipe(
        catchError(() => {
          this.countdownList.set(snapshot);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onSubmit(): void {
    const campaignId = this.context.campaignId();
    if (this.form.invalid || this.adding() || campaignId === null) return;

    this.adding.set(true);
    const { name, type, loopBehavior, startingValue } = this.form.getRawValue();

    this.countdownService
      .createCountdown({ campaignId, name, type, loopBehavior, startingValue })
      .pipe(
        tap(created => {
          this.countdownList.update(current => [...current, created]);
          this.form.reset({ name: '', type: 'STANDARD', loopBehavior: 'NONE', startingValue: 4 });
          this.addFormOpen.set(false);
          this.adding.set(false);
        }),
        catchError(() => {
          this.adding.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private load(campaignId: number | null): void {
    if (campaignId === null) return;

    this.loading.set(true);
    this.loadFailed.set(false);

    this.countdownService
      .getCountdowns(campaignId)
      .pipe(
        tap(countdowns => {
          this.countdownList.set(countdowns);
          this.loading.set(false);
        }),
        catchError(() => {
          this.loadFailed.set(true);
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private replaceRow(countdown: CountdownResponse): void {
    this.countdownList.update(current =>
      current.map(item => (item.id === countdown.id ? countdown : item)),
    );
  }
}
