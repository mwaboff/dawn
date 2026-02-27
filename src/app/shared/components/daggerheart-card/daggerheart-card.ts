import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardData, CardType, CARD_TYPE_LABELS } from './daggerheart-card.model';
import { escapeAndFormatHtml } from '../../utils/text.utils';
import { CardFeatureItem } from './card-feature-item/card-feature-item';

@Component({
  selector: 'app-daggerheart-card',
  templateUrl: './daggerheart-card.html',
  styleUrl: './daggerheart-card.css',
  imports: [CardFeatureItem],
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
    return escapeAndFormatHtml(text);
  }

  typeLabel(type: CardType): string {
    return CARD_TYPE_LABELS[type];
  }
}
