import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * The shared shell for one party-list-style disclosure row on the run screen -- the campaign GM
 * screen's `sheet-viewer-panel.html`'s `.party__row` pattern, generalized so both
 * `RunAdversaryRow` and the environment row build on one implementation instead of each
 * reimplementing the toggle/chevron/`[hidden]`-detail mechanics.
 *
 * The `.stat-row__*` classes this template uses (and the ones `RunAdversaryRow`/
 * `RunEnvironmentPanel` project in via `[row-identity]`/`[row-secondary]`/`[row-vitals]`) are
 * declared once in the global `shared/styles/stat-row.css`, shared with `sheet-viewer-panel.css`'s
 * `.party__row` -- the two used to be a copy-renamed fork with identical values, which this
 * project's CLAUDE.md bans.
 *
 * `[row-identity]` (the name line) and `[row-secondary]` (the "Solo · Tier 3" / "Level 3" / "Event"
 * line beneath it) are two *separate* `<ng-content>` selectors landing as direct siblings inside
 * `.stat-row__identity`, not one slot with both lines nested inside a single wrapper -- that's
 * what makes `.stat-row__identity`'s `flex-direction: column` (in `shared/styles/stat-row.css`)
 * genuinely arrange two real flex items, rather than getting one child that happens to stack its
 * own contents as a side effect of an inner element being block-level. `sheet-viewer-panel.html`'s
 * `.party__row` never had this indirection (it writes `.stat-row__name`/`.stat-row__secondary`
 * directly, with no projection layer in between), which is why the party row's stacking was never
 * fragile the way the projected version briefly was.
 *

 * Deliberately just a shell: with every interactive control (HP/Stress marking, tokens, defeat)
 * now living in the expanded detail rather than the row, the row itself is pure read-only content
 * plus one disclosure control, so it can be a single `<button>` exactly like `.party__row` -- no
 * nested-interactive-control workaround needed.
 *
 * Root element is a plain `<div>`, not an `<li>` -- this component is nested one level *inside*
 * `RunAdversaryRow`/`RunEnvironmentPanel`'s own host element, which is the actual direct child of
 * the run view's `role="list"` container and carries `role="listitem"` itself (see those
 * components' `host` binding). A second `role`/`<li>` here would be a nested listitem, which
 * breaks the same ARIA list/listitem relationship this was meant to express.
 */
@Component({
  selector: 'app-run-stat-row',
  templateUrl: './run-stat-row.html',
  styleUrl: './run-stat-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunStatRow {
  readonly expanded = input.required<boolean>();
  readonly detailId = input.required<string>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  /** Dims the read-only identity/vitals content -- supplementary only. Whatever marks the
   * defeated/inactive state visually (a skull glyph, a badge) must carry the meaning on its own;
   * this is never the only signal. */
  readonly muted = input<boolean>(false);
  /** Distinguishes the environment's single row from adversary rows at a glance without a
   * different design language -- same shell, a quieter accent. */
  readonly variant = input<'adversary' | 'environment'>('adversary');

  readonly toggled = output<void>();
}
