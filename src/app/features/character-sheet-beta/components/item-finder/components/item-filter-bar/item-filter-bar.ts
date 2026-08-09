import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { isRovingTabKey, nextRovingTabIndex } from '../../../../../../shared/utils/roving-tabindex.utils';
import { InventoryItemType } from '../../../../utils/inventory-card.mapper';

export type ItemFilterType = 'all' | InventoryItemType;

const VERTICAL_KEY_ALIASES: Record<string, string> = {
  ArrowUp: 'ArrowLeft',
  ArrowDown: 'ArrowRight',
};

/** Filters as data -- see AGENTS.md on option lists never being enumerated twice. */
const FILTERS: readonly { readonly value: ItemFilterType; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'weapon', label: 'Weapons' },
  { value: 'armor', label: 'Armor' },
  { value: 'loot', label: 'Loot' },
];

/**
 * Narrows what the item finder is looking through: which kind of gear, and whether to hide the
 * official catalogue and leave only homebrew.
 *
 * A radiogroup rather than a tablist -- these chips filter one list in place, they do not swap
 * between panels, and the two patterns disagree about what Enter and the arrow keys do. Per the
 * WAI-ARIA radiogroup pattern the arrow keys both move focus and select, so a keyboard user
 * narrows the list by arrowing across it rather than arrowing and then confirming.
 */
@Component({
  selector: 'app-item-filter-bar',
  templateUrl: './item-filter-bar.html',
  styleUrl: './item-filter-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFilterBar {
  readonly type = input.required<ItemFilterType>();
  readonly customOnly = input.required<boolean>();

  readonly typeChange = output<ItemFilterType>();
  readonly customOnlyChange = output<boolean>();

  readonly filters = FILTERS;

  private readonly group = viewChild<ElementRef<HTMLElement>>('group');

  getTabIndex(value: ItemFilterType): number {
    return value === this.type() ? 0 : -1;
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    // The APG radiogroup pattern binds both axes, and these chips genuinely wrap onto two rows at
    // narrow widths, so Up/Down are the natural keys there. The shared roving helper only knows the
    // horizontal keys -- teaching it the vertical ones would also change the inventory tab strip,
    // where a horizontal tablist should leave Up/Down to the page. Mapping them here instead.
    const key = VERTICAL_KEY_ALIASES[event.key] ?? event.key;
    if (!isRovingTabKey(key)) return;
    event.preventDefault();
    const next = nextRovingTabIndex(key, index, FILTERS.length);
    // Focus first: the moved-to chip is still `tabindex="-1"` until the parent echoes the new type
    // back down, and a programmatic `.focus()` works on it either way.
    this.group()?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
    this.typeChange.emit(FILTERS[next].value);
  }
}
