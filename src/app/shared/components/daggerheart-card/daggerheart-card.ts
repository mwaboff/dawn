import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardData, CardType, CARD_TYPE_LABELS } from './daggerheart-card.model';
import { CardFeatureItem } from './card-feature-item/card-feature-item';
import { FormatTextPipe } from '../../pipes/format-text.pipe';

@Component({
  selector: 'app-daggerheart-card',
  templateUrl: './daggerheart-card.html',
  styleUrls: ['./daggerheart-card.css', './daggerheart-card-variants.css', './daggerheart-card-wide.css'],
  imports: [CardFeatureItem, FormatTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaggerheartCard {
  readonly card = input.required<CardData>();
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  /**
   * A stat block being displayed for reference, not offered as a selectable option -- the
   * encounter builder's roster (`encounter-roster.html`) is the current consumer. Unlike
   * `disabled` (a fadeable, unavailable *choice*), a read-only card is neither faded nor
   * height-capped: `disabled` was being reused for this before it existed, which made every card
   * fade to 50% opacity and clip at 340px with no click-to-expand available to lift the cap, since
   * disabled cards ignore clicks.
   * (The run screen's environment/adversary rows no longer use `DaggerheartCard` at all -- they
   * were rebuilt on the party-list `RunStatRow` pattern instead, see that component's doc.)
   */
  readonly readOnly = input<boolean>(false);
  readonly layout = input<'default' | 'wide'>('default');
  readonly collapsibleFeatures = input<boolean>(false);
  readonly cardClicked = output<CardData>();

  private readonly featuresExpanded = signal(false);

  get isFeaturesExpanded(): boolean {
    return this.featuresExpanded();
  }

  onCardClick(): void {
    if (this.disabled() || this.readOnly()) return;
    this.cardClicked.emit(this.card());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) return;
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
    return CARD_TYPE_LABELS[type];
  }
}
