import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { SearchableEntityType, typeLabels, typeGlyphs } from '../../models/search.model';

export interface FacetTab {
  type: SearchableEntityType | null;
  label: string;
  glyph: string;
}

const BROWSABLE_TYPES: SearchableEntityType[] = [
  'WEAPON', 'ARMOR', 'LOOT', 'ADVERSARY', 'FEATURE',
  'CLASS', 'SUBCLASS_CARD', 'ANCESTRY_CARD', 'COMMUNITY_CARD', 'DOMAIN_CARD', 'DOMAIN',
];

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

  private readonly focusedIndex = signal(0);

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
    const tabCount = this.tabs.length;
    let nextIndex = index;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (index + 1) % tabCount;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = (index - 1 + tabCount) % tabCount;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabCount - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.typeChange.emit(this.tabs[index].type);
        return;
      default:
        return;
    }

    this.focusedIndex.set(nextIndex);
    this.focusTab(nextIndex);
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
