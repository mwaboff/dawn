import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { EncounterService } from '../../shared/services/encounter.service';
import { EncounterRunService } from '../../shared/services/encounter-run.service';
import { EncounterResponse, EncounterAdversaryResponse } from '../../shared/models/encounter-api.model';
import { EncounterRunResponse } from '../../shared/models/encounter-run-api.model';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { InlineDeleteConfirm } from '../../shared/components/inline-delete-confirm/inline-delete-confirm';
import { ENCOUNTER_NEW_PATH, encounterEditPath, encounterRunPath } from './encounter-routes';

/** One in-progress fight paired with the saved encounter it was started from, for display. */
export interface ActiveRunEntry {
  run: EncounterRunResponse;
  encounterName: string;
}

function effectiveTier(entry: EncounterAdversaryResponse): number | undefined {
  return entry.tierOverride ?? entry.adversary?.tier;
}

/** `"Tier 2"`, `"Tier 1–3"` across a mixed-tier roster, or a placeholder for an empty one. */
export function tierRangeLabel(encounter: EncounterResponse): string {
  const tiers = encounter.adversaries.map(effectiveTier).filter((t): t is number => t !== undefined);
  if (tiers.length === 0) return 'No adversaries yet';
  const min = Math.min(...tiers);
  const max = Math.max(...tiers);
  return min === max ? `Tier ${min}` : `Tier ${min}–${max}`;
}

/**
 * The GM's saved encounters. `GET /api/dh/encounters` returns official, public, and the caller's
 * own encounters together (there's no server-side `mine` filter), so this narrows to `creatorId`
 * client-side -- official/public prebuilt encounters are a follow-up, not this phase's job.
 */
@Component({
  selector: 'app-encounters',
  templateUrl: './encounters.html',
  styleUrl: './encounters.css',
  imports: [RouterLink, ConfirmDialog, InlineDeleteConfirm],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Encounters implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly encounterService = inject(EncounterService);
  private readonly encounterRunService = inject(EncounterRunService);
  private readonly destroyRef = inject(DestroyRef);

  readonly newEncounterPath = ENCOUNTER_NEW_PATH;

  readonly encounters = signal<EncounterResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly pendingDeleteId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly copyingId = signal<number | null>(null);
  /** The confirm dialog closes as soon as the request settles, so a failed delete needs its own
   * visible feedback -- otherwise it looks identical to a successful one. */
  readonly deleteError = signal(false);
  private deleteErrorTimeout?: ReturnType<typeof setTimeout>;

  readonly activeRuns = signal<EncounterRunResponse[]>([]);
  readonly activeRunsLoading = signal(true);
  /** Pairs each run with its encounter's name for display -- the run list endpoint only carries
   * `encounterId`. Falls back to a placeholder if the source encounter isn't in `encounters()`
   * (e.g. it belongs to another user, out of scope for this campaign-free page). */
  readonly activeRunEntries = computed<ActiveRunEntry[]>(() =>
    this.activeRuns().map(run => ({
      run,
      encounterName: this.encounters().find(e => e.id === run.encounterId)?.name ?? 'Unknown Encounter',
    })),
  );

  readonly pendingDiscardId = signal<number | null>(null);
  readonly discardingId = signal<number | null>(null);
  readonly discardError = signal(false);
  private discardErrorTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.deleteErrorTimeout);
      clearTimeout(this.discardErrorTimeout);
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadActiveRuns();
  }

  getTierRangeLabel(encounter: EncounterResponse): string {
    return tierRangeLabel(encounter);
  }

  isOverBudget(encounter: EncounterResponse): boolean {
    return encounter.spentBattlePoints > encounter.suggestedBattlePoints;
  }

  onCreate(): void {
    this.router.navigate([this.newEncounterPath]);
  }

  onEdit(id: number): void {
    this.router.navigate([encounterEditPath(id)]);
  }

  onRun(id: number): void {
    this.router.navigate([encounterRunPath(id)]);
  }

  onResume(run: EncounterRunResponse): void {
    this.router.navigate([encounterRunPath(run.encounterId)]);
  }

  onCopy(id: number): void {
    this.copyingId.set(id);
    this.encounterService
      .copyEncounter(id)
      .pipe(catchError(() => { this.copyingId.set(null); return of(null); }))
      .subscribe(copy => {
        this.copyingId.set(null);
        if (copy) {
          this.router.navigate([encounterEditPath(copy.id)]);
        }
      });
  }

  onDeleteRequest(id: number): void {
    this.pendingDeleteId.set(id);
  }

  onDeleteConfirm(): void {
    this.confirmingDeleteId.set(this.pendingDeleteId());
  }

  onDeleteCancel(): void {
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const id = this.confirmingDeleteId();
    if (id === null) return;
    this.deletingId.set(id);
    // Not a catchError/of(null) pipe: a successful DELETE is 204 No Content, which HttpClient
    // also emits as `null` -- indistinguishable from a `null` failure sentinel. next/error are
    // the only channels that actually tell success and failure apart here.
    this.deleteError.set(false);
    this.encounterService.deleteEncounter(id).subscribe({
      next: () => {
        this.encounters.update(list => list.filter(e => e.id !== id));
        this.resetDeleteState();
      },
      error: () => {
        this.resetDeleteState();
        this.deleteError.set(true);
        clearTimeout(this.deleteErrorTimeout);
        this.deleteErrorTimeout = setTimeout(() => this.deleteError.set(false), 4000);
      },
    });
  }

  onCancelDelete(): void {
    this.resetDeleteState();
  }

  private resetDeleteState(): void {
    this.pendingDeleteId.set(null);
    this.confirmingDeleteId.set(null);
    this.deletingId.set(null);
  }

  onDiscardRequest(runId: number): void {
    this.pendingDiscardId.set(runId);
  }

  onDiscardCancel(): void {
    this.pendingDiscardId.set(null);
  }

  onDiscardConfirm(): void {
    const runId = this.pendingDiscardId();
    if (runId === null) return;
    this.discardingId.set(runId);
    this.discardError.set(false);
    // Same 204-as-null caveat as onConfirmDelete -- next/error are the only channels that tell a
    // successful discard from a failed one.
    this.encounterRunService.deleteRun(runId).subscribe({
      next: () => {
        this.activeRuns.update(list => list.filter(r => r.id !== runId));
        this.resetDiscardState();
      },
      error: () => {
        this.resetDiscardState();
        this.discardError.set(true);
        clearTimeout(this.discardErrorTimeout);
        this.discardErrorTimeout = setTimeout(() => this.discardError.set(false), 4000);
      },
    });
  }

  private resetDiscardState(): void {
    this.pendingDiscardId.set(null);
    this.discardingId.set(null);
  }

  private loadActiveRuns(): void {
    this.encounterRunService
      .getRuns({ status: 'ACTIVE' })
      .pipe(catchError(() => of(null)))
      .subscribe(runs => {
        if (runs) {
          this.activeRuns.set(runs);
        }
        this.activeRunsLoading.set(false);
      });
  }

  private load(): void {
    const userId = this.authService.user()?.id;
    this.encounterService
      .getEncounters({ size: 50, expand: 'adversaryDetails' })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of(null);
        }),
      )
      .subscribe(response => {
        if (response) {
          this.encounters.set(response.content.filter(e => e.creatorId === userId));
        }
        this.loading.set(false);
      });
  }
}
