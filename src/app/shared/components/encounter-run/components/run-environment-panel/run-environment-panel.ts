import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, tap } from 'rxjs';

import { EnvironmentService } from '../../../../services/environment.service';
import { CardData } from '../../../daggerheart-card/daggerheart-card.model';
import { RunStatRow } from '../run-stat-row/run-stat-row';
import { RunEnvironmentDetail } from './components/run-environment-detail/run-environment-detail';

/**
 * The encounter's environment: one row on the run screen, styled identically to an adversary row
 * (the same shared `RunStatRow` shell) so the whole screen reads as one system, with a quieter
 * left-accent variant marking it as the stage rather than a combatant. Independent data source
 * from the run itself (its own load/error state, fetched by `environmentId` rather than `runId`),
 * so it owns its own loading/error/retry rather than adding a second triple of signals to the run
 * view.
 *
 * Unlike an adversary, an environment has no HP, Stress, tokens, or defeated state -- there is
 * nothing to invent empty slots for, so its row only ever shows a Difficulty vital and its detail
 * is purely presentational (`RunEnvironmentDetail`, with no interactive controls at all). Its
 * identity content (name + type on a secondary line) uses only the globally-shared
 * `.stat-row__*` classes (`shared/styles/stat-row.css`), so unlike `RunAdversaryRow` it needs no
 * local partial in `styleUrls` for the content it projects into `RunStatRow`.
 *
 * `role: 'listitem'` on the host for the same reason as `RunAdversaryRow`'s: this component's own
 * selector is the actual DOM child of the run view's `role="list"` container.
 */
@Component({
  selector: 'app-run-environment-panel',
  templateUrl: './run-environment-panel.html',
  styleUrl: './run-environment-panel.css',
  imports: [RunStatRow, RunEnvironmentDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem' },
})
export class RunEnvironmentPanel {
  private readonly environmentService = inject(EnvironmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly environmentId = input.required<number>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');

  private readonly cardState = signal<CardData | null>(null);
  readonly card = this.cardState.asReadonly();
  readonly loading = signal(true);
  readonly failed = signal(false);

  private readonly expanded = signal(false);
  readonly isExpanded = this.expanded.asReadonly();
  readonly detailId = computed(() => `run-environment-${this.environmentId()}-detail`);

  readonly impulses = computed(() => this.detail('impulses'));
  readonly potentialAdversaries = computed(() => this.detail('potentialAdversaries'));

  /** A number when the printed stat block gives one; the verbatim rules callout (e.g. "Special
   * (see 'Relative Strength')") when it doesn't -- see `EnvironmentResponse` for why the two are
   * mutually exclusive. */
  readonly difficultyLabel = computed(() => {
    const meta = this.card()?.metadata;
    const numeric = meta?.['difficulty'];
    if (typeof numeric === 'number') return String(numeric);
    const special = meta?.['difficultySpecial'];
    return typeof special === 'string' && special.length > 0 ? special : undefined;
  });

  constructor() {
    effect(() => {
      const id = this.environmentId();
      untracked(() => this.load(id));
    });
  }

  toggleExpanded(): void {
    this.expanded.update(v => !v);
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
