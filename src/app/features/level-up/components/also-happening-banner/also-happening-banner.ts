import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Compact, always-visible banner listing this level-up's AUTOMATIC changes (tier achievements,
 * companion Training, companion Experience grants) -- placed above `level-up.html`'s `@switch` so
 * it stays visible across every tab, not just one step. Purely presentational: `level-up.ts`
 * computes the item text (`alsoHappeningItems`), this component just renders the list. Exists
 * mainly to state plainly that Training does NOT consume either advancement slot -- a real point
 * of player confusion the plan calls out by name.
 */
@Component({
  selector: 'app-also-happening-banner',
  templateUrl: './also-happening-banner.html',
  styleUrl: './also-happening-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlsoHappeningBanner {
  readonly items = input<string[]>([]);
}
