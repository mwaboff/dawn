import { Component, input, output, computed, effect, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';

import { Tab, TabId } from '../../models/create-character.model';

@Component({
  selector: 'app-tab-nav',
  templateUrl: './tab-nav.html',
  styleUrl: './tab-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabNav {
  readonly tabs = input.required<Tab[]>();
  readonly activeTab = input.required<TabId>();
  readonly tabSelected = output<TabId>();

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

  selectTab(tabId: TabId): void {
    this.tabSelected.emit(tabId);
  }

  goToPrevious(): void {
    const tabs = this.tabs();
    const prev = tabs[this.activeIndex() - 1];
    if (prev) {
      this.tabSelected.emit(prev.id);
    }
  }

  goToNext(): void {
    const tabs = this.tabs();
    const next = tabs[this.activeIndex() + 1];
    if (next) {
      this.tabSelected.emit(next.id);
    }
  }

  private scrollActiveTabIntoView(tabId: TabId): void {
    const container = this.trailScroll()?.nativeElement;
    if (!container) return;

    const tabElement = container.querySelector<HTMLElement>(`#tab-${tabId}`);
    tabElement?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  private updateTrailLineWidth(): void {
    const container = this.trailScroll()?.nativeElement;
    const line = this.trailLine()?.nativeElement;
    if (!container || !line) return;

    line.style.width = `${container.scrollWidth}px`;
  }
}
