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
  readonly disabled = input<boolean>(false);
  readonly layout = input<'default' | 'wide'>('default');
  readonly collapsibleFeatures = input<boolean>(false);
  readonly cardClicked = output<CardData>();

  private readonly featuresExpanded = signal(false);

  get isFeaturesExpanded(): boolean {
    return this.featuresExpanded();
  }

  onCardClick(): void {
    if (this.disabled()) return;
    this.cardClicked.emit(this.card());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }

  toggleFeatures(event: Event): void {
    event.stopPropagation();
    this.featuresExpanded.set(!this.featuresExpanded());
  }

  formatText(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.replace(/\n/g, '<br>');
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
