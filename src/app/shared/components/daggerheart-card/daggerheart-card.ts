import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

import {
  CardData,
  CardType,
  CARD_TYPE_LABELS,
  RESTRICTED_CARD_TITLE,
  restrictedCardMessage,
} from './daggerheart-card.model';
import { CardFeatureItem } from './card-feature-item/card-feature-item';
import { FormatTextPipe } from '../../pipes/format-text.pipe';
import { LockIcon } from '../lock-icon/lock-icon';

@Component({
  selector: 'app-daggerheart-card',
  templateUrl: './daggerheart-card.html',
  styleUrls: ['./daggerheart-card.css', './daggerheart-card-variants.css', './daggerheart-card-wide.css'],
  imports: [CardFeatureItem, FormatTextPipe, LockIcon],
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

  /** Exposed for the template; the copy itself lives in `daggerheart-card.model.ts` so the
   * classic and beta (`cardDataToEntityCard`) faces never drift apart. */
  readonly restrictedTitle = RESTRICTED_CARD_TITLE;

  private readonly featuresExpanded = signal(false);

  get isFeaturesExpanded(): boolean {
    return this.featuresExpanded();
  }

  onCardClick(): void {
    if (this.disabled() || this.readOnly() || this.card().restricted) return;
    this.cardClicked.emit(this.card());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly() || this.card().restricted) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }

  restrictedMessage(expansionName: string | undefined): string {
    return restrictedCardMessage(expansionName);
  }

  toggleFeatures(event: Event): void {
    event.stopPropagation();
    this.featuresExpanded.set(!this.featuresExpanded());
  }

  typeLabel(type: CardType): string {
    return CARD_TYPE_LABELS[type];
  }
}
