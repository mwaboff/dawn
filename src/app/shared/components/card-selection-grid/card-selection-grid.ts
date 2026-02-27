import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DaggerheartCard } from '../daggerheart-card/daggerheart-card';
import { CardSkeleton } from '../card-skeleton/card-skeleton';
import { CardError } from '../card-error/card-error';
import { CardData } from '../daggerheart-card/daggerheart-card.model';

@Component({
  selector: 'app-card-selection-grid',
  imports: [DaggerheartCard, CardSkeleton, CardError],
  templateUrl: './card-selection-grid.html',
  styleUrl: './card-selection-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSelectionGrid {
  readonly cards = input.required<CardData[]>();
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly selectedCard = input<CardData>();
  readonly skeletonCount = input<number>(6);
  readonly collapsibleFeatures = input<boolean>(false);
  readonly layout = input<'default' | 'wide'>('default');

  readonly cardSelected = output<CardData>();

  isCardSelected(card: CardData): boolean {
    return this.selectedCard()?.id === card.id;
  }
}
