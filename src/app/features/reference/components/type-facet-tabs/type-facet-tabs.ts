import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { SearchableEntityType, typeLabels, typeGlyphs, BROWSABLE_TYPES } from '../../../../shared/models/search.model';
import { isRovingTabKey, nextRovingTabIndex } from '../../../../shared/utils/roving-tabindex.utils';

export interface FacetTab {
  type: SearchableEntityType | null;
  label: string;
  glyph: string;
}

@Component({
  selector: 'app-type-facet-tabs',
  templateUrl: './type-facet-tabs.html',
  styleUrl: './type-facet-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'type-facet-host',
  },
})
export class TypeFacetTabs {
  readonly activeType = input<SearchableEntityType | null>(null);
  readonly typeChange = output<SearchableEntityType | null>();

  @ViewChild('tabList') tabListRef!: ElementRef<HTMLElement>;

  readonly tabs: FacetTab[] = [
    { type: null, label: 'All', glyph: '✦' },
    ...BROWSABLE_TYPES.map(t => ({
      type: t,
      label: typeLabels[t] ?? t,
      glyph: typeGlyphs[t] ?? '◆',
    })),
  ];

  readonly activeIndex = computed(() => {
    const active = this.activeType();
    const idx = this.tabs.findIndex(t => t.type === active);
    return idx >= 0 ? idx : 0;
  });

  isActive(tab: FacetTab): boolean {
    return tab.type === this.activeType();
  }

  onTabClick(tab: FacetTab): void {
    this.typeChange.emit(tab.type);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (isRovingTabKey(event.key)) {
      event.preventDefault();
      const nextIndex = nextRovingTabIndex(event.key, index, this.tabs.length);
      this.focusTab(nextIndex);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.typeChange.emit(this.tabs[index].type);
    }
  }

  private focusTab(index: number): void {
    const listEl = this.tabListRef?.nativeElement;
    if (!listEl) return;
    const buttons = listEl.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[index]?.focus();
  }

  getTabIndex(index: number): number {
    return index === this.activeIndex() ? 0 : -1;
  }
}
