import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';

import { CampaignService } from '../../../../../shared/services/campaign.service';
import { GmScreenContext } from '../../gm-screen-context.service';

/** Daggerheart caps the Fear pool at 12; the backend rejects anything outside 0-12. */
const FEAR_MAX = 12;

@Component({
  selector: 'app-fear-counter-panel',
  templateUrl: './fear-counter-panel.html',
  styleUrl: './fear-counter-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FearCounterPanel {
  private readonly context = inject(GmScreenContext);
  private readonly campaignService = inject(CampaignService);
  private readonly destroyRef = inject(DestroyRef);

  readonly max = FEAR_MAX;
  readonly fear = this.context.fear;
  readonly saving = computed(() => this.context.isSaving('fear'));

  /**
   * One entry per point of the pool, true where it is filled. The pips carry the reading at a
   * glance from across the table; the numeral is the precise value.
   */
  readonly pips = computed(() => Array.from({ length: FEAR_MAX }, (_, i) => i < this.fear()));

  constructor() {
    this.initSavePipeline();
  }

  adjust(delta: number): void {
    const next = Math.min(FEAR_MAX, Math.max(0, this.fear() + delta));
    if (next === this.fear()) return;
    this.context.fear.set(next);
    this.context.fearSave$.next();
  }

  /**
   * No debounce: a tap is a discrete decision the table is watching for. `switchMap` is what makes
   * rapid tapping safe -- an in-flight PATCH is cancelled by the next one, so the last value wins.
   */
  private initSavePipeline(): void {
    this.context.fearSave$
      .pipe(
        switchMap(() => {
          const id = this.context.campaignId();
          if (id === null) return EMPTY;
          const snapshot = this.context.campaign()?.fear ?? 0;
          this.context.markSaving('fear');
          return this.campaignService.updateFear(id, this.fear()).pipe(
            tap(response => {
              this.context.patchCampaign(response);
              this.context.clearSaving('fear');
            }),
            catchError(() => {
              this.context.fear.set(snapshot);
              this.context.clearSaving('fear');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
