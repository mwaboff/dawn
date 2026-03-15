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
  readonly selectedCards = input<CardData[]>([]);
  readonly maxSelections = input<number>(1);
  readonly skeletonCount = input<number>(6);
  readonly collapsibleFeatures = input<boolean>(false);
  readonly layout = input<'default' | 'wide'>('default');

  readonly cardSelected = output<CardData>();
  readonly cardsSelected = output<CardData[]>();

  isCardSelected(card: CardData): boolean {
    if (this.maxSelections() === 1) {
      return this.selectedCard()?.id === card.id || this.selectedCards().some(c => c.id === card.id);
    }
    return this.selectedCards().some(c => c.id === card.id);
  }

  onCardClicked(card: CardData): void {
    if (this.maxSelections() === 1) {
      this.cardSelected.emit(card);
      return;
    }

    const current = this.selectedCards();
    const idx = current.findIndex(c => c.id === card.id);

    if (idx >= 0) {
      this.cardsSelected.emit(current.filter(c => c.id !== card.id));
    } else if (current.length < this.maxSelections()) {
      this.cardsSelected.emit([...current, card]);
    }
  }

  cardAccentColor(card: CardData): string | null {
    return (card.metadata?.['accentColor'] as string) ?? null;
  }

  get selectionCount(): number {
    return this.selectedCards().length;
  }
}
