import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { EncounterService } from '../../shared/services/encounter.service';
import { EncounterResponse, EncounterAdversaryResponse } from '../../shared/models/encounter-api.model';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { InlineDeleteConfirm } from '../../shared/components/inline-delete-confirm/inline-delete-confirm';
import { ENCOUNTER_NEW_PATH, encounterEditPath } from './encounter-routes';

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

  readonly newEncounterPath = ENCOUNTER_NEW_PATH;

  readonly encounters = signal<EncounterResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly pendingDeleteId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly copyingId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
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
    this.encounterService
      .deleteEncounter(id)
      .pipe(catchError(() => { this.resetDeleteState(); return of(null); }))
      .subscribe(result => {
        if (result !== null) {
          this.encounters.update(list => list.filter(e => e.id !== id));
        }
        this.resetDeleteState();
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

  private load(): void {
    const userId = this.authService.user()?.id;
    this.encounterService
      .getEncounters({ size: 50, expand: 'adversaryDetails' })
      .pipe(
        catchError((err: HttpErrorResponse) => {
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
