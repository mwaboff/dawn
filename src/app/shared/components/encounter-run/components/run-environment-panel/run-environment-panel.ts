import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, tap } from 'rxjs';

import { EnvironmentService } from '../../../../services/environment.service';
import { CardData } from '../../../daggerheart-card/daggerheart-card.model';
import { DaggerheartCard } from '../../../daggerheart-card/daggerheart-card';

/**
 * The encounter's environment stat block -- a second, independent data source from the run
 * itself (its own load/error state, fetched by `environmentId` rather than `runId`), so it owns
 * its own loading/error/retry rather than adding a second triple of signals to the run view.
 *
 * Also renders Impulses and Potential Adversaries, which `daggerheart-card` doesn't surface from
 * `CardData.metadata` -- both matter for running the scene, so they get their own labelled lines
 * alongside the card rather than a hand-rebuilt environment card.
 */
@Component({
  selector: 'app-run-environment-panel',
  templateUrl: './run-environment-panel.html',
  styleUrl: './run-environment-panel.css',
  imports: [DaggerheartCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunEnvironmentPanel {
  private readonly environmentService = inject(EnvironmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly environmentId = input.required<number>();

  private readonly cardState = signal<CardData | null>(null);
  readonly card = this.cardState.asReadonly();
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly impulses = computed(() => this.detail('impulses'));
  readonly potentialAdversaries = computed(() => this.detail('potentialAdversaries'));

  constructor() {
    effect(() => {
      const id = this.environmentId();
      untracked(() => this.load(id));
    });
  }

  retry(): void {
    this.load(this.environmentId());
  }

  private load(id: number): void {
    this.loading.set(true);
    this.failed.set(false);

    this.environmentService
      .getEnvironment(id)
      .pipe(
        tap(card => {
          this.cardState.set(card);
          this.loading.set(false);
        }),
        catchError(() => {
          this.failed.set(true);
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private detail(key: 'impulses' | 'potentialAdversaries'): string | undefined {
    const value = this.card()?.metadata?.[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
