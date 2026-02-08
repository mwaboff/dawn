import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

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

  private readonly mobileDrawerOpen = signal(false);
  readonly isDrawerOpen = this.mobileDrawerOpen.asReadonly();

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update((open) => !open);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  selectTab(tabId: TabId): void {
    this.tabSelected.emit(tabId);
    this.closeMobileDrawer();
  }
}
