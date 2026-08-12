import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { LockIcon } from '../../../../shared/components/lock-icon/lock-icon';

/**
 * Fills a card slot the owner can no longer see (SRD vs. paid-expansion content gating) -- the
 * slot must stay in place rather than vanish, so `character-sheet.html` swaps to this in place of
 * the normal card body wherever `card.restricted` is true. Only classic needs this as a component:
 * the beta sheet renders the same locked look for free through `EntityCard` (see
 * `cardDataToEntityCard`), because classic hand-rolls its own `.equipment-card`/`.expandable-card`
 * markup instead of going through a shared card component.
 *
 * Same icon and copy as `daggerheart-card`'s own `card--restricted` face, so a restricted card
 * reads identically whether it's found browsing the catalogue or already on a sheet -- see
 * `RESTRICTED_CARD_TITLE`/`restrictedCardMessage`, the single shared source for both.
 *
 * `<ng-content>` is for a slot-specific action a caller still wants available on a locked card --
 * e.g. moving a restricted domain card between equipped and vault only needs its id, not its
 * content, so that action stays offered.
 */
@Component({
  selector: 'app-restricted-card-placeholder',
  templateUrl: './restricted-card-placeholder.html',
  styleUrl: './restricted-card-placeholder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockIcon],
})
export class RestrictedCardPlaceholder {
  /** The paid book this card belongs to, when the backend knows it. Degrades gracefully when
   * absent -- see `restrictedCardMessage`. */
  readonly expansionName = input<string | undefined>(undefined);

  readonly title = RESTRICTED_CARD_TITLE;

  readonly message = computed(() => restrictedCardMessage(this.expansionName()));
}
