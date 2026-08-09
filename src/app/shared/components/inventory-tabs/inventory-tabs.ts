import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { isRovingTabKey, nextRovingTabIndex } from '../../utils/roving-tabindex.utils';

export type InventoryTab = 'weapons' | 'armor' | 'loot';

/** The three tabs as data -- see AGENTS.md on nav items never being enumerated twice. */
const TABS: readonly { readonly id: InventoryTab; readonly label: string }[] = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'loot', label: 'Loot' },
];

/**
 * The Weapons / Armor / Loot tab strip, with its roving-tabindex keyboard handling. Shared because
 * the classic inventory and the beta card inventory show the same three tabs over the same three
 * lists and only disagree about how a single item is drawn -- two copies of a tablist is two places
 * to fix an arrow-key bug.
 */
@Component({
  selector: 'app-inventory-tabs',
  templateUrl: './inventory-tabs.html',
  styleUrl: './inventory-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryTabs {
  readonly activeTab = input.required<InventoryTab>();
  /** Item count per tab; a zero count renders no chip rather than a "0". */
  readonly counts = input.required<Record<InventoryTab, number>>();
  /**
   * Prefix for the tab and panel ids, so a host can own its own. Only the selected tab advertises
   * `aria-controls`: the hosts render one panel at a time, and pointing the other two tabs at ids
   * that are not in the DOM is worse than not pointing them anywhere.
   */
  readonly panelIdPrefix = input('inventory-panel');

  readonly tabSelected = output<InventoryTab>();

  readonly tabs = TABS;

  private readonly tabList = viewChild<ElementRef<HTMLElement>>('tabList');

  /** The panel names the tab it belongs to through this id -- see the hosts' `aria-labelledby`. */
  tabId(tab: InventoryTab): string {
    return `${this.panelIdPrefix()}-tab-${tab}`;
  }

  getTabIndex(tab: InventoryTab): number {
    return tab === this.activeTab() ? 0 : -1;
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    if (isRovingTabKey(event.key)) {
      event.preventDefault();
      this.focusTabAt(nextRovingTabIndex(event.key, index, TABS.length));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.tabSelected.emit(TABS[index].id);
    }
  }

  private focusTabAt(index: number): void {
    const buttons = this.tabList()?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[index]?.focus();
  }
}
