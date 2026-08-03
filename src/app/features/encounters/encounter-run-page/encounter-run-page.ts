import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';

import { EncounterRunService } from '../../../shared/services/encounter-run.service';
import { EncounterService } from '../../../shared/services/encounter.service';
import { EncounterRunView } from '../../../shared/components/encounter-run/encounter-run-view';
import { CardError } from '../../../shared/components/card-error/card-error';
import { ENCOUNTERS_LIST_PATH } from '../encounter-routes';

/**
 * Thin host for `/encounters/:id/run` -- `:id` is the encounter, not the run. Resolves to a run
 * (resuming an existing ACTIVE one, or starting a fresh one) and hands off to
 * {@link EncounterRunView} for the fight itself. Deliberately campaign-free: `startRun` is called
 * with no `campaignId`, so any authenticated user can run their own encounter with no GM role.
 *
 * Also fetches the encounter itself, but only for its `name` -- to caption the run view's
 * header with which encounter is running. `EncounterRunView` never fetches the encounter on its
 * own; the GM panel host doesn't need to duplicate that request just to serve this one caption.
 */
@Component({
  selector: 'app-encounter-run-page',
  templateUrl: './encounter-run-page.html',
  styleUrl: './encounter-run-page.css',
  imports: [EncounterRunView, CardError],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterRunPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly runService = inject(EncounterRunService);
  private readonly encounterService = inject(EncounterService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly runId = signal<number | null>(null);
  readonly encounterName = signal<string | null>(null);

  private encounterId: number | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.encounterId = id;
    this.resolveRun(id);
  }

  retryLoad(): void {
    if (this.encounterId === null) return;
    this.resolveRun(this.encounterId);
  }

  onCompleted(): void {
    this.router.navigate([ENCOUNTERS_LIST_PATH]);
  }

  private resolveRun(encounterId: number): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      encounter: this.encounterService.getEncounter(encounterId),
      run: this.runService.getRuns({ status: 'ACTIVE' }).pipe(
        switchMap(runs => {
          const active = runs.find(run => run.encounterId === encounterId);
          return active ? of(active) : this.runService.startRun(encounterId);
        }),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ encounter, run }) => {
          this.encounterName.set(encounter.name);
          this.runId.set(run.id);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
