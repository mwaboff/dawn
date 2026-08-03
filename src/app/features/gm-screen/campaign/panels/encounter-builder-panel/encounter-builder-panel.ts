import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, forkJoin, tap } from 'rxjs';

import { EncounterResponse } from '../../../../../shared/models/encounter-api.model';
import { EncounterRunResponse } from '../../../../../shared/models/encounter-run-api.model';
import { EncounterService } from '../../../../../shared/services/encounter.service';
import { EncounterRunService } from '../../../../../shared/services/encounter-run.service';
import { EncounterRunView } from '../../../../../shared/components/encounter-run/encounter-run-view';
import { CardError } from '../../../../../shared/components/card-error/card-error';
import { GmScreenContext } from '../../gm-screen-context.service';
import { PanelEncounterRow } from './components/panel-encounter-row/panel-encounter-row';

interface ActiveRunView {
  readonly runId: number;
  readonly encounterName: string;
}

/**
 * Hosts the campaign's saved encounters and lets a GM run one. Thin host only -- fight logic
 * lives entirely in `EncounterRunView` (Phase 5); this panel lists encounters, starts/resumes
 * runs, and switches between the list and the shared run view.
 *
 * `EncounterRunView` is hosted at `density="compact"` with `[showHeader]="false"`, which hides
 * only its title/standing block -- `RunLifecycleActions` (Complete/Discard) always renders inside
 * it, so this panel doesn't duplicate it. This panel's own compact header supplies just the run
 * name plus a "Back to list" escape that returns to the list without ending the run (it stays
 * resumable for any GM in the campaign).
 */
@Component({
  selector: 'app-encounter-builder-panel',
  templateUrl: './encounter-builder-panel.html',
  styleUrl: './encounter-builder-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EncounterRunView, CardError, PanelEncounterRow],
})
export class EncounterBuilderPanel {
  private readonly context = inject(GmScreenContext);
  private readonly encounterService = inject(EncounterService);
  private readonly runService = inject(EncounterRunService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly encounterList = signal<readonly EncounterResponse[]>([]);
  readonly encounters = this.encounterList.asReadonly();
  private readonly activeRunList = signal<readonly EncounterRunResponse[]>([]);

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly startingEncounterId = signal<number | null>(null);
  readonly startError = signal<string | null>(null);
  readonly activeRun = signal<ActiveRunView | null>(null);

  constructor() {
    effect(() => {
      const campaignId = this.context.campaignId();
      untracked(() => this.load(campaignId));
    });
  }

  /** Whether `encounterId` already has an ACTIVE run tagged to this campaign. */
  resumingId(encounterId: number): boolean {
    return this.activeRunList().some(run => run.encounterId === encounterId);
  }

  onRun(encounter: EncounterResponse): void {
    const campaignId = this.context.campaignId();
    if (campaignId === null || this.startingEncounterId() !== null) return;

    const existing = this.activeRunList().find(run => run.encounterId === encounter.id);
    if (existing) {
      this.activeRun.set({ runId: existing.id, encounterName: encounter.name });
      return;
    }

    this.startingEncounterId.set(encounter.id);
    this.startError.set(null);

    this.runService
      .startRun(encounter.id, { campaignId })
      .pipe(
        tap(run => {
          this.startingEncounterId.set(null);
          this.activeRunList.update(current => [...current, run]);
          this.activeRun.set({ runId: run.id, encounterName: encounter.name });
        }),
        catchError(() => {
          this.startingEncounterId.set(null);
          this.startError.set(`Couldn't start "${encounter.name}" — try again.`);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onBackToList(): void {
    this.activeRun.set(null);
  }

  retryLoad(): void {
    this.load(this.context.campaignId());
  }

  onRunEnded(): void {
    this.activeRun.set(null);
    this.load(this.context.campaignId());
  }

  private load(campaignId: number | null): void {
    if (campaignId === null) return;

    this.loading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      encounters: this.encounterService.getEncounters({ size: 100 }),
      runs: this.runService.getRuns({ status: 'ACTIVE', campaignId }),
    })
      .pipe(
        tap(({ encounters, runs }) => {
          this.encounterList.set(encounters.content.filter(e => e.campaignId === campaignId));
          this.activeRunList.set(runs);
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
}
