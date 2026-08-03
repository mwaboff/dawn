import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { CardSelectionGrid } from '../../../../../shared/components/card-selection-grid/card-selection-grid';
import { CardData } from '../../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EnvironmentService } from '../../../../../shared/services/environment.service';

/**
 * Attaches an optional scene stat block to the encounter. Environments cost no Battle Points --
 * this picker never touches the meter, it only sets `environmentId` on save.
 */
@Component({
  selector: 'app-environment-picker',
  templateUrl: './environment-picker.html',
  styleUrl: './environment-picker.css',
  imports: [CardSelectionGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentPicker implements OnInit {
  private readonly environmentService = inject(EnvironmentService);

  readonly selectedEnvironmentId = input<number | undefined>(undefined);
  /** Emits the full card, not just its id, so the parent can show it (name/type/tier) in the
   * roster without holding a second copy of the environment catalog. */
  readonly environmentSelected = output<CardData | undefined>();

  readonly environments = signal<CardData[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly selectedCard = computed(() => this.environments().find(c => c.id === this.selectedEnvironmentId()));

  ngOnInit(): void {
    this.environmentService
      .getEnvironmentsPaginated({ size: 50 })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of(null);
        }),
      )
      .subscribe(result => {
        if (result) {
          this.environments.set(result.cards);
        }
        this.loading.set(false);
      });
  }

  onCardSelected(card: CardData): void {
    this.environmentSelected.emit(this.selectedEnvironmentId() === card.id ? undefined : card);
  }

  onClear(): void {
    this.environmentSelected.emit(undefined);
  }
}
