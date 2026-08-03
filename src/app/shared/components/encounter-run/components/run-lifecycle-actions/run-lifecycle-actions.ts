import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';

import { EncounterRunService } from '../../../../services/encounter-run.service';
import { EncounterService } from '../../../../services/encounter.service';
import { EncounterRunResponse } from '../../../../models/encounter-run-api.model';
import { ConfirmDialog } from '../../../confirm-dialog/confirm-dialog';
import { InlineDeleteConfirm } from '../../../inline-delete-confirm/inline-delete-confirm';

/**
 * Ends or resets the run, one way or another: Complete (POST .../complete), Reset (discard the
 * current run and start a fresh one against the same encounter, preserving its `campaignId`), or
 * Delete Encounter (a confirmed `DELETE /api/dh/encounters/{id}` -- the backend cascades any of
 * the encounter's own ACTIVE runs in the same transaction, so this never needs to also delete
 * the run itself). Also opens the encounter editor in a new tab (Edit) -- editing never touches
 * this live run (`EncounterRunService.startRun` snapshots the adversaries at start time), so
 * edits only ever apply the next time the encounter is run; Reset is exactly the action that
 * starts a next time.
 *
 * Self-contained on purpose -- unlike the per-adversary mutations in `EncounterRunView`, none of
 * Complete/Reset/Delete touch `runState.adversaries` directly, so they get their own
 * completing/resetting/deleting state and their own inline error.
 *
 * There used to be a fourth action here, "Discard", that only deleted the *run* -- its label
 * ("Discard the encounter") never matched what it actually destroyed. Deleting the encounter is
 * the real fix for that mismatch, so Discard is gone; Reset now covers the "start this fight
 * over" case Discard was sometimes used for.
 */
@Component({
  selector: 'app-run-lifecycle-actions',
  templateUrl: './run-lifecycle-actions.html',
  styleUrl: './run-lifecycle-actions.css',
  imports: [ConfirmDialog, InlineDeleteConfirm, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Escape-to-dismiss the edit note lives here (a host listener), not on a template element --
  // the note popover isn't a modal and never steals focus (see `showEditNote`'s doc), so focus
  // stays on the <a> a GM just clicked, and the listener has to sit on a real ancestor of that
  // anchor for the bubbled keydown to ever reach it. A `(keydown.escape)` bound to a template
  // <span> around just the edit controls hit `@angular-eslint/template/interactive-supports-focus`
  // (a non-focusable element with an interaction handler) since ng-template-eslint can't tell this
  // apart from an element meant to be operated directly; the component's own host is already a
  // real ancestor of everything below it, so it avoids that false positive too. Harmless to fire
  // if the note isn't open -- `dismissEditNote()` is a no-op set(false) either way.
  host: { '(keydown.escape)': 'dismissEditNote()' },
})
export class RunLifecycleActions {
  private readonly runService = inject(EncounterRunService);
  private readonly encounterService = inject(EncounterService);
  private readonly destroyRef = inject(DestroyRef);

  readonly runId = input.required<number>();
  readonly encounterId = input.required<number>();
  /** Falls back to ungrammatical-but-safe generic phrasing when the host has no real encounter
   * name to offer (the GM panel host doesn't currently pass one -- see the component doc). */
  readonly encounterLabel = input<string>('this encounter');
  /** Preserved across a Reset so a campaign-tagged run starts its replacement the same way. */
  readonly campaignId = input<number | undefined>(undefined);
  /** The encounter editor's URL. Optional: a host that doesn't supply one just doesn't get an
   * Edit control (see `EncounterRunView.editHref`'s doc for why this can't derive its own path). */
  readonly editHref = input<string>();

  /** Fired after a successful Complete only now -- Reset and Delete Encounter have their own,
   * more specific outputs below, since a host needs different data (the new run; nothing) to
   * react to each correctly. */
  readonly completed = output<void>();
  /** Emits the freshly-started run that replaces the discarded one, so the host/parent can swap
   * to it without a second round trip. */
  readonly runReset = output<EncounterRunResponse>();
  readonly encounterDeleted = output<void>();

  readonly completing = signal(false);
  readonly resetPending = signal(false);
  readonly resetting = signal(false);
  readonly deletePending = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);

  /** Overrides `InlineDeleteConfirm`'s generic "Delete?" -- this is the one screen where the item
   * being deleted (the saved encounter) isn't the only thing at stake. `EncounterRunService`
   * cascades: deleting the encounter hard-deletes its ACTIVE run in the same transaction, so a GM
   * mid-fight who taps the trashcan expecting to tidy up their encounter list would otherwise lose
   * the live HP/Stress/tokens/notes in front of them with no warning that was ever on the table.
   * The old "Discard" action (see this component's doc) carried exactly this warning for the run
   * alone; Delete Encounter destroys strictly more and had regressed to carrying none.
   *
   * The "can't be recovered" clause is scoped to the run's live state only, in its own sentence --
   * `EncounterService.deleteEncounter` is a *soft* delete with an admin-only restore endpoint
   * (`POST /{id}/restore`), but the run's own delete is hard, nothing to restore from. An earlier
   * version of this copy closed with one blanket "this cannot be undone" covering both, which
   * overstated the encounter half. `"live HP, Stress, tokens, and notes"` is deliberately the same
   * phrase, same order, as the encounters list page's own delete-confirm copy (`encounters.html`),
   * so a GM sees one consistent warning across both surfaces, not two different tellings of it. */
  readonly deleteConfirmText =
    "Deletes the saved encounter. This run's live HP, Stress, tokens, and notes are deleted with it — that data can't be recovered.";

  /** On-demand only -- shown once Edit is actually clicked, never as a persistent line (the user
   * was explicit: "I don't want to waste space"). Doesn't gate or delay the new-tab navigation;
   * the `<a>`'s own `target="_blank"` click behaviour proceeds exactly as normal alongside this. */
  readonly showEditNote = signal(false);

  onEditClick(): void {
    this.showEditNote.set(true);
  }

  dismissEditNote(): void {
    this.showEditNote.set(false);
  }

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

  requestReset(): void {
    this.deletePending.set(false); // Only one of the two confirmations shows at a time.
    this.resetPending.set(true);
  }

  cancelReset(): void {
    this.resetPending.set(false);
  }

  confirmReset(): void {
    if (this.resetting()) return;

    this.resetting.set(true);
    this.error.set(null);

    this.runService
      .deleteRun(this.runId())
      .pipe(
        switchMap(() => this.runService.startRun(this.encounterId(), { campaignId: this.campaignId() })),
        tap(newRun => {
          this.resetting.set(false);
          this.resetPending.set(false);
          this.runReset.emit(newRun);
        }),
        catchError(() => {
          this.resetting.set(false);
          this.resetPending.set(false);
          this.error.set("Couldn't reset the encounter — try again.");
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  requestDelete(): void {
    this.resetPending.set(false); // Only one of the two confirmations shows at a time.
    this.deletePending.set(true);
  }

  cancelDelete(): void {
    this.deletePending.set(false);
  }

  confirmDelete(): void {
    if (this.deleting()) return;

    this.deleting.set(true);
    this.error.set(null);

    this.encounterService
      .deleteEncounter(this.encounterId())
      .pipe(
        tap(() => {
          this.deleting.set(false);
          this.deletePending.set(false);
          this.encounterDeleted.emit();
        }),
        catchError(() => {
          this.deleting.set(false);
          this.deletePending.set(false);
          this.error.set("Couldn't delete the encounter — try again.");
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
