import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * `CardSkeleton`'s beta counterpart -- a loading placeholder shaped like `EntityCard` rather than
 * `DaggerheartCard`, for `EntitySelectionGrid`. A separate component rather than a mode on
 * `CardSkeleton` on purpose: the two have no markup or state in common beyond "a grid of pulsing
 * placeholder boxes" (different DOM shape, different sizing, token-driven colour here vs.
 * `CardSkeleton`'s fixed dark palette), and `CardSkeleton` is still shared by `CardSelectionGrid`
 * and `codex-skeleton` on the classic path -- untouched, not even imported here.
 *
 * Card colour reads `--color-card-face`/`--color-card-rule`/`--color-card-ink` (the same tokens
 * `EntityCard` itself renders with), so it flips with `data-card-theme` on an ancestor exactly like
 * a real card, rather than assuming one theme. `layout` mirrors `EntitySelectionGrid`'s own input
 * so the grid the skeleton sits in has the identical column count the real cards will render
 * into -- no reflow when loading finishes.
 */
@Component({
  selector: 'app-entity-skeleton',
  templateUrl: './entity-skeleton.html',
  styleUrl: './entity-skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitySkeleton {
  readonly count = input(6);
  readonly layout = input<'default' | 'wide'>('default');
  /** Mirrors `EntitySelectionGrid`'s `columns` input exactly -- see its doc comment. Passed straight
   * through by `EntitySelectionGrid`'s template so the skeleton's column count always matches
   * whatever the real cards are about to render into. */
  readonly columns = input<'auto' | 2>('auto');

  protected readonly Array = Array;

  /** `layout="wide"` (always 1 column) wins over `columns="2"` (cap at 2) -- see `columns`' doc. */
  isColumnCapped(): boolean {
    return this.columns() === 2 && this.layout() !== 'wide';
  }
}
