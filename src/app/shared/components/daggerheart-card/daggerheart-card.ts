import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardData, CardType } from './daggerheart-card.model';

@Component({
  selector: 'app-daggerheart-card',
  templateUrl: './daggerheart-card.html',
  styleUrl: './daggerheart-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaggerheartCard {
  readonly card = input.required<CardData>();
  readonly selected = input<boolean>(false);
  readonly cardClicked = output<CardData>();

  private readonly featuresExpanded = signal(false);

  get isFeaturesExpanded(): boolean {
    return this.featuresExpanded();
  }

  onCardClick(): void {
    this.cardClicked.emit(this.card());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }

  toggleFeatures(event: Event): void {
    event.stopPropagation();
    this.featuresExpanded.set(!this.featuresExpanded());
  }

  typeLabel(type: CardType): string {
    switch (type) {
      case 'class':
        return 'Class';
      case 'subclass':
        return 'Subclass';
      case 'heritage':
        return 'Heritage';
      case 'community':
        return 'Community';
      case 'ancestry':
        return 'Ancestry';
      case 'domain':
        return 'Domain';
    }
  }
}
