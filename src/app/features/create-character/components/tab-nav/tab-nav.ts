import { Component, input, output, computed, effect, viewChild, ElementRef, ChangeDetectionStrategy, inject } from '@angular/core';

import { Tab, TabId } from '../../models/create-character.model';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { isRovingTabKey, nextRovingTabIndex } from '../../../../shared/utils/roving-tabindex.utils';

@Component({
  selector: 'app-tab-nav',
  templateUrl: './tab-nav.html',
  styleUrl: './tab-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabNav {
  readonly tabs = input.required<Tab[]>();
  readonly activeTab = input.required<TabId>();
  readonly completedSteps = input.required<Set<TabId>>();
  readonly tabSelected = output<TabId>();

  private readonly preferences = inject(PreferencesService);

  private readonly trailScroll = viewChild<ElementRef<HTMLElement>>('trailScroll');
  private readonly trailLine = viewChild<ElementRef<HTMLElement>>('trailLine');

  private readonly activeIndex = computed(() =>
    this.tabs().findIndex((t) => t.id === this.activeTab())
  );

  constructor() {
    effect(() => {
      const tabId = this.activeTab();
      setTimeout(() => this.scrollActiveTabIntoView(tabId), 0);
    });

    effect(() => {
      this.tabs();
      setTimeout(() => this.updateTrailLineWidth(), 0);
    });
  }

  readonly isFirstStep = computed(() => this.activeIndex() === 0);
  readonly isLastStep = computed(() => this.activeIndex() === this.tabs().length - 1);

  readonly isNextDisabled = computed(() => {
    const currentTabId = this.activeTab();
    return this.isLastStep() || !this.completedSteps().has(currentTabId);
  });

  readonly activeLabel = computed(() => {
    const tab = this.tabs()[this.activeIndex()];
    return tab?.label ?? '';
  });

  readonly nextLabel = computed(() => {
    const tabs = this.tabs();
    const next = tabs[this.activeIndex() + 1];
    return next?.label ?? '';
  });

  readonly prevLabel = computed(() => {
    const tabs = this.tabs();
    const prev = tabs[this.activeIndex() - 1];
    return prev?.label ?? '';
  });

  isTabDisabled(tabId: TabId): boolean {
    const targetIndex = this.tabs().findIndex((t) => t.id === tabId);
    const currentIndex = this.activeIndex();

    // Current tab and previous tabs are never disabled
    if (targetIndex <= currentIndex) return false;

    // Future tab: disabled unless all prior steps are completed
    for (let i = 0; i < targetIndex; i++) {
      if (!this.completedSteps().has(this.tabs()[i].id)) return true;
    }
    return false;
  }

  isTabCompleted(tabId: TabId): boolean {
    return this.completedSteps().has(tabId);
  }

  getTabIndex(tabId: TabId): number {
    return tabId === this.activeTab() ? 0 : -1;
  }

  selectTab(tabId: TabId): void {
    if (!this.isTabDisabled(tabId)) {
      this.tabSelected.emit(tabId);
    }
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    if (isRovingTabKey(event.key)) {
      event.preventDefault();
      const nextIndex = nextRovingTabIndex(event.key, index, tabs.length, i =>
        this.isTabDisabled(tabs[i].id),
      );
      this.focusTabAt(nextIndex);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectTab(tabs[index].id);
    }
  }

  private focusTabAt(index: number): void {
    const container = this.trailScroll()?.nativeElement;
    const tabs = this.tabs();
    const target = tabs[index];
    if (!container || !target) return;
    container.querySelector<HTMLButtonElement>(`#tab-${target.id}`)?.focus();
  }

  goToPrevious(): void {
    const tabs = this.tabs();
    const prev = tabs[this.activeIndex() - 1];
    if (prev) {
      this.tabSelected.emit(prev.id);
    }
  }

  goToNext(): void {
    if (!this.isNextDisabled()) {
      const tabs = this.tabs();
      const next = tabs[this.activeIndex() + 1];
      if (next) {
        this.tabSelected.emit(next.id);
      }
    }
  }

  private scrollActiveTabIntoView(tabId: TabId): void {
    const container = this.trailScroll()?.nativeElement;
    if (!container) return;

    const tabElement = container.querySelector<HTMLElement>(`#tab-${tabId}`);
    const behavior = this.preferences.effectiveMotion() === 'reduced' ? 'auto' : 'smooth';
    tabElement?.scrollIntoView?.({ behavior, inline: 'center', block: 'nearest' });
  }

  private updateTrailLineWidth(): void {
    const container = this.trailScroll()?.nativeElement;
    const line = this.trailLine()?.nativeElement;
    if (!container || !line) return;

    line.style.width = `${container.scrollWidth}px`;
  }
}
