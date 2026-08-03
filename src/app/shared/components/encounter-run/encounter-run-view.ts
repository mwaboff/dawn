import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, tap } from 'rxjs';

import { EncounterRunService } from '../../services/encounter-run.service';
import { EncounterRunAdversaryResponse, EncounterRunResponse, UpdateEncounterRunAdversaryRequest } from '../../models/encounter-run-api.model';
import { CardSkeleton } from '../card-skeleton/card-skeleton';
import { CardError } from '../card-error/card-error';
import { RunAdversaryRow } from './components/run-adversary-row/run-adversary-row';
import { RunEnvironmentPanel } from './components/run-environment-panel/run-environment-panel';
import { RunLifecycleActions } from './components/run-lifecycle-actions/run-lifecycle-actions';

/**
 * The screen a GM actually fights an encounter on: live HP/Stress/Tokens per adversary, the
 * scene's environment stat block, and Complete/Reset/Delete Encounter for the run as a whole.
 *
 * Owns exactly one concern directly -- loading the run and the adversaries' optimistic
 * update/PATCH/rollback, all of it operating on the same owned `runState.adversaries` array
 * through a single `applyUpdate` helper. Two things that would otherwise add independent
 * loading/error/data triples to this file are split out instead: the environment stat block
 * (its own `environmentId`, its own load/error/retry -- {@link RunEnvironmentPanel}) and ending
 * the run (Complete/Reset/Delete touch `runId`/`encounterId` only, never `runState.adversaries`
 * -- {@link RunLifecycleActions}). Reset is the one exception that reaches back in: it replaces
 * `runState` wholesale with the fresh run {@link RunLifecycleActions} emits, rather than doing a
 * second `getRun` round trip for data the child already has in hand.
 *
 * Campaign-free by construction -- no `GmScreenContext`, no `ActivatedRoute` reads read here.
 * `campaignId` is read *off the loaded run* (never injected) purely to hand back to
 * `RunLifecycleActions` so a Reset preserves it -- Phase 6 hosts this same component inside the
 * campaign GM screen; a standalone `/encounters/:id/run` page hosts it first. Either host decides
 * what happens after the run ends -- this component only emits `completed`/`encounterDeleted`.
 */
@Component({
  selector: 'app-encounter-run-view',
  templateUrl: './encounter-run-view.html',
  styleUrl: './encounter-run-view.css',
  imports: [CardSkeleton, CardError, RunAdversaryRow, RunEnvironmentPanel, RunLifecycleActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterRunView {
  private readonly runService = inject(EncounterRunService);
  private readonly destroyRef = inject(DestroyRef);

  readonly runId = input.required<number>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  /** Gates the title and standing count only -- `RunLifecycleActions` (Complete/Discard) always
   * renders, since it's the only way to end a run and no host may lose it. */
  readonly showHeader = input<boolean>(true);
  /** Heading text for `showHeader`'s `<h2>`. The GM panel host supplies its own chrome (and
   * hides this title/standing block), so only the standalone run page -- the one place that
   * knows which encounter this is -- has a reason to override the generic default. */
  readonly title = input<string>('Running Encounter');
  /** The encounter editor's URL, opened in a new tab from `RunLifecycleActions`'s Edit control.
   * Optional and passed straight through with no fallback: this component can't import
   * `encounterEditPath()` itself (`shared/` must never import from `features/`), so a host that
   * doesn't supply one simply doesn't get an Edit control, rather than this component inventing a
   * hand-typed URL that could drift from the real route. */
  readonly editHref = input<string>();
  readonly completed = output<void>();
  /** The encounter itself was deleted (not just this run) -- distinct from `completed` since a
   * host may reasonably want to react differently (e.g. a toast confirming what's actually gone). */
  readonly encounterDeleted = output<void>();

  private readonly runState = signal<EncounterRunResponse | null>(null);
  readonly run = this.runState.asReadonly();
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  /** Most recent failed adversary-row PATCH, cleared on the next successful mutation. */
  readonly actionError = signal<string | null>(null);
  /** Polite live region text -- lets a screen-reader GM hear the result of a click. */
  readonly announcement = signal('');

  readonly adversaries = computed(() =>
    [...(this.run()?.adversaries ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
  );

  /** "4 of 7 standing" -- the single number a GM checks most often mid-fight. Absent when the
   * encounter has no adversaries at all; there's no fight left to summarize. */
  readonly standingCount = computed(() => {
    const rows = this.adversaries();
    if (rows.length === 0) return null;
    const standing = rows.filter(row => !row.isDefeated).length;
    return `${standing} of ${rows.length} standing`;
  });

  constructor() {
    effect(() => {
      const id = this.runId();
      untracked(() => this.loadRun(id));
    });
  }

  retryLoad(): void {
    this.loadRun(this.runId());
  }

  /**
   * `RunLifecycleActions` already deleted the old run and started this new one -- refetching by
   * `runId` would just be a slower way to arrive at data already in hand, and `runId` itself is
   * an input this component doesn't own, so there's nothing to redirect it to anyway. The next
   * full load of this page (a refresh, or a fresh mount) resolves the new run normally since it's
   * the only ACTIVE run left for this encounter.
   */
  onReset(newRun: EncounterRunResponse): void {
    this.runState.set(newRun);
    this.actionError.set(null);
    this.announcement.set('Encounter reset to its starting state.');
  }

  onHpChange(row: EncounterRunAdversaryResponse, value: number): void {
    const request: UpdateEncounterRunAdversaryRequest = { hitPointsMarked: value };
    if (value >= row.hitPointMax) request.isDefeated = true;

    const announcement = request.isDefeated
      ? `${this.rowLabel(row)} marked ${value} of ${row.hitPointMax} HP. Defeated.`
      : `${this.rowLabel(row)} marked ${value} of ${row.hitPointMax} HP.`;
    this.applyUpdate(row, request, announcement);
  }

  onStressChange(row: EncounterRunAdversaryResponse, value: number): void {
    this.applyUpdate(row, { stressMarked: value }, `${this.rowLabel(row)} marked ${value} of ${row.stressMax} Stress.`);
  }

  onTokensChange(row: EncounterRunAdversaryResponse, value: number): void {
    this.applyUpdate(row, { tokens: value }, `${this.rowLabel(row)} has ${value} token${value === 1 ? '' : 's'}.`);
  }

  onDefeatToggle(row: EncounterRunAdversaryResponse): void {
    const isDefeated = !row.isDefeated;
    this.applyUpdate(row, { isDefeated }, `${this.rowLabel(row)} ${isDefeated ? 'defeated' : 'revived'}.`);
  }

  onNoteChange(row: EncounterRunAdversaryResponse, note: string): void {
    this.applyUpdate(row, { note }, `Note updated for ${this.rowLabel(row)}.`);
  }

  private loadRun(runId: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.runService
      .getRun(runId)
      .pipe(
        tap(run => {
          this.runState.set(run);
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

  /**
   * `request`'s fields are always a same-named, same-typed subset of `EncounterRunAdversaryResponse`
   * (hitPointsMarked, stressMarked, tokens, isDefeated, note), so it doubles as both the optimistic
   * local patch and the PATCH body -- one object instead of two near-duplicates per call site.
   *
   * Applies it locally first, then sends it. Replaces the row from the server response on success
   * (the response is authoritative -- e.g. a looped/derived value); rolls back to the pre-click
   * snapshot on failure. Never sends deltas.
   */
  private applyUpdate(
    row: EncounterRunAdversaryResponse,
    request: UpdateEncounterRunAdversaryRequest,
    announcementText: string,
  ): void {
    const run = this.run();
    if (!run) return;

    const snapshot = row;
    this.replaceAdversary({ ...row, ...request });
    this.actionError.set(null);

    this.runService
      .updateAdversary(run.id, row.id, request)
      .pipe(
        tap(updated => {
          const fresh = updated.adversaries.find(a => a.id === row.id);
          if (fresh) this.replaceAdversary(fresh);
          this.announcement.set(announcementText);
        }),
        catchError(() => {
          this.replaceAdversary(snapshot);
          this.actionError.set(`Couldn't update ${this.rowLabel(row)} — try again.`);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private replaceAdversary(updated: EncounterRunAdversaryResponse): void {
    const run = this.runState();
    if (!run) return;
    this.runState.set({ ...run, adversaries: run.adversaries.map(a => (a.id === updated.id ? updated : a)) });
  }

  private rowLabel(row: EncounterRunAdversaryResponse): string {
    return row.label ?? row.adversary?.name ?? 'Adversary';
  }
}
