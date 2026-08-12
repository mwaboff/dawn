import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The one lock glyph every locked-card face draws -- `EntityCard`, `DaggerheartCard`,
 * `AdversaryCard` and `RestrictedCardPlaceholder` used to each keep their own copy of this exact
 * `<svg>`; this is the single asset all four now render instead; see `RESTRICTED_CARD_TITLE` /
 * `restrictedCardMessage` (`daggerheart-card.model.ts`) for the copy that goes with it.
 *
 * Sizing and colour are deliberately the caller's, not an input: every caller already targets its
 * own scoped class name (`.card__restricted-icon`, `.adversary-card__restricted-icon`, ...) on the
 * `<app-lock-icon>` tag itself, and a class selector written in the CALLER's stylesheet -- scoped
 * to the caller's own template via Angular's emulated encapsulation -- reaches that host element
 * directly, no `::ng-deep` required. The `:host`/`svg` rule below is only the unstyled fallback.
 */
@Component({
  selector: 'app-lock-icon',
  templateUrl: './lock-icon.html',
  styles: `
    :host { display: inline-block; width: 24px; height: 24px; }
    svg { width: 100%; height: 100%; display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockIcon {}
