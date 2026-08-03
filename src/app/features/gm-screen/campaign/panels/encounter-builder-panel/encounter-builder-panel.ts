import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { ENCOUNTER_NEW_PATH, encounterEditPath } from '../../../../encounters/encounter-routes';

interface ActiveRunView {
  readonly runId: number;
  readonly encounterId: number;
  readonly encounterName: string;
}

/** The page-0 request size below -- kept alongside the note that warns the GM the list may be
 * truncated at it. */
const FETCH_SIZE = 100;

/**
 * Hosts the campaign's visible encounters (official, public, or the GM's own) and lets a GM run
 * one. Thin host only -- fight logic lives entirely in `EncounterRunView` (Phase 5); this panel
 * lists encounters, starts/resumes a run, and swaps between the list and the run view.
 *
 * There is no "attach" step. An earlier version tracked one locally "attached" encounter in
 * `localStorage`, but that made a second GM blind to a run already in progress: their browser had
 * no record of it, so the encounter looked untouched. A run's own `campaignId` (set when it
 * starts, via `startRun`) is what's genuinely campaign-shared, so `resumingId()` reads the
 * server's ACTIVE-run list directly -- every row that already has a run shows "Resume" for every
 * GM, with no per-browser state to go stale or disagree between them.
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
  imports: [EncounterRunView, CardError, PanelEncounterRow, RouterLink],
})
export class EncounterBuilderPanel {
  private readonly context = inject(GmScreenContext);
  private readonly encounterService = inject(EncounterService);
  private readonly runService = inject(EncounterRunService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly newEncounterPath = ENCOUNTER_NEW_PATH;
  /** Exposed so the template can resolve the running encounter's edit URL -- `EncounterRunView`
   * takes it as a plain `editHref` string rather than importing the route itself, since
   * `shared/` code must never import from `features/`. */
  readonly encounterEditPath = encounterEditPath;

  private readonly encounterList = signal<readonly EncounterResponse[]>([]);
  readonly encounters = this.encounterList.asReadonly();
  private readonly activeRunList = signal<readonly EncounterRunResponse[]>([]);

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly startingEncounterId = signal<number | null>(null);
  readonly startError = signal<string | null>(null);
  readonly activeRun = signal<ActiveRunView | null>(null);

  /** True while `refreshActiveRuns()` is in flight, so a Resume click can't act on the
   * about-to-be-replaced `activeRunList` before the fresh data lands -- see `onRun()`. */
  readonly refreshingRuns = signal(false);

  readonly query = signal('');
  /** Narrows what's already loaded -- see `atFetchCap` for the honest caveat about what "already
   * loaded" means once the fetch is at its page size. */
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.encounterList();
    return q ? all.filter(e => e.name.toLowerCase().includes(q)) : all;
  });
  readonly atFetchCap = computed(() => this.encounterList().length >= FETCH_SIZE);

  private readonly runHeadingRef = viewChild<ElementRef<HTMLElement>>('runHeading');
  private readonly listHeadingRef = viewChild<ElementRef<HTMLElement>>('listHeading');

  constructor() {
    effect(() => {
      const campaignId = this.context.campaignId();
      untracked(() => this.load(campaignId));
    });
  }

  /** Whether `encounterId` already has an ACTIVE run tagged to this campaign. */
  resumingId(encounterId: number): boolean {
    return this.findActiveRun(encounterId) !== undefined;
  }

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onRun(encounter: EncounterResponse): void {
    const campaignId = this.context.campaignId();
    if (campaignId === null || this.startingEncounterId() !== null || this.refreshingRuns()) return;

    const existing = this.findActiveRun(encounter.id);
    if (existing) {
      this.activeRun.set({ runId: existing.id, encounterId: encounter.id, encounterName: encounter.name });
      this.focusAfterRender(() => this.runHeadingRef()?.nativeElement.focus());
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
          this.activeRun.set({ runId: run.id, encounterId: encounter.id, encounterName: encounter.name });
          this.focusAfterRender(() => this.runHeadingRef()?.nativeElement.focus());
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

  /**
   * Back is non-destructive -- the run keeps going -- but a Reset while viewing swaps the run
   * out for a new one server-side without telling this host (`EncounterRunView` has no output for
   * it; see its `onReset` doc comment). Refreshing `activeRunList` here, rather than trusting the
   * id cached from the last full `load()`, is what keeps a later Resume pointed at the run that
   * actually still exists instead of the one Reset just deleted.
   */
  onBackToList(): void {
    this.activeRun.set(null);
    this.refreshActiveRuns();
    this.focusListHeading();
  }

  retryLoad(): void {
    this.load(this.context.campaignId());
  }

  /**
   * Wired to both `(completed)` and `(encounterDeleted)` -- either way the run is gone, so a full
   * `load()` is the right recovery (an encounter deletion cascades to its ACTIVE run server-side,
   * so `activeRunList` needs refreshing here too, not just `encounterList`).
   *
   * Unlike `onBackToList()`, focus can't be scheduled immediately: `load()` gates the whole list
   * -- including the heading `focusListHeading()` targets -- behind `loading`, so scheduling the
   * focus call before that resolves would fire against a DOM that doesn't have the target mounted
   * yet. `load()`'s own `onLoaded` hook runs after `loading` flips back to `false`, once the
   * heading is actually there to receive it. `EncounterRunPage`'s equivalent doesn't need any of
   * this -- it does a full `router.navigate()`, so the router handles focus -- but this panel
   * swaps components in place, so nothing else will.
   */
  onRunEnded(): void {
    this.activeRun.set(null);
    this.load(this.context.campaignId(), () => this.focusListHeading());
  }

  /** Schedules DOM work (focus) for after Angular has rendered the resulting state change --
   * the framework's actual contract for this, rather than a `queueMicrotask` racing zoneless CD. */
  private focusAfterRender(fn: () => void): void {
    afterNextRender(fn, { injector: this.injector });
  }

  private focusListHeading(): void {
    this.focusAfterRender(() => this.listHeadingRef()?.nativeElement.focus());
  }

  private findActiveRun(encounterId: number): EncounterRunResponse | undefined {
    return this.activeRunList().find(run => run.encounterId === encounterId);
  }

  /**
   * `refreshingRuns` closes the window between "Back was clicked" and "the fresh list landed" --
   * `onRun()` refuses to act on `activeRunList` while it's set, so a Resume click can't open a run
   * Reset already deleted just because this GET hadn't resolved yet.
   *
   * A failed refresh must not leave `activeRunList` stale forever (a GM would be stuck retrying a
   * dead run indefinitely with no recovery path), so failure falls back to the same full `load()`
   * that `retryLoad()`/`onRunEnded()` already use -- its existing loading/error UI is the recovery
   * path here too, rather than a second bespoke error surface for this one call site. `load()`
   * flips `loading` to `true` in the same synchronous tick this clears `refreshingRuns`, so the
   * list is never rendered clickable in between with data that's still stale.
   */
  private refreshActiveRuns(): void {
    const campaignId = this.context.campaignId();
    if (campaignId === null) return;

    this.refreshingRuns.set(true);

    this.runService
      .getRuns({ status: 'ACTIVE', campaignId })
      .pipe(
        tap(runs => {
          this.activeRunList.set(runs);
          this.refreshingRuns.set(false);
        }),
        catchError(() => {
          this.refreshingRuns.set(false);
          this.load(campaignId);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** `onLoaded` runs only after a successful load actually lands -- callers that need to touch
   * the now-refreshed DOM (see `onRunEnded()`) hook in here rather than racing the fetch. */
  private load(campaignId: number | null, onLoaded?: () => void): void {
    if (campaignId === null) return;

    this.loading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      encounters: this.encounterService.getEncounters({ size: FETCH_SIZE }),
      runs: this.runService.getRuns({ status: 'ACTIVE', campaignId }),
    })
      .pipe(
        tap(({ encounters, runs }) => {
          this.encounterList.set(encounters.content);
          this.activeRunList.set(runs);
          this.loading.set(false);
          onLoaded?.();
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
