import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { TabNav } from './tab-nav';
import { Tab, TabId, CHARACTER_TABS } from '../../models/create-character.model';

@Component({
  template: `
    <app-tab-nav
      [tabs]="tabs"
      [activeTab]="activeTab()"
      (tabSelected)="onTabSelected($event)"
    />
  `,
  imports: [TabNav],
})
class TestHost {
  tabs: Tab[] = CHARACTER_TABS;
  activeTab = signal<TabId>('class');
  selectedTab: TabId | null = null;

  onTabSelected(tabId: TabId): void {
    this.selectedTab = tabId;
    this.activeTab.set(tabId);
  }
}

describe('TabNav', () => {
  let hostFixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHost);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    const tabNav = hostFixture.nativeElement.querySelector('app-tab-nav');
    expect(tabNav).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should render all 9 desktop folder tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const desktopTabs = compiled.querySelectorAll('.desktop-tabs .folder-tab');
      expect(desktopTabs.length).toBe(9);
    });

    it('should render all 9 mobile drawer items', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const drawerItems = compiled.querySelectorAll('.mobile-drawer .drawer-item');
      expect(drawerItems.length).toBe(9);
    });
  });

  describe('Mobile Drawer', () => {
    it('should toggle drawer when hamburger is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button') as HTMLButtonElement;

      expect(compiled.querySelector('.mobile-drawer.open')).toBeFalsy();

      hamburger.click();
      hostFixture.detectChanges();
      expect(compiled.querySelector('.mobile-drawer.open')).toBeTruthy();

      hamburger.click();
      hostFixture.detectChanges();
      expect(compiled.querySelector('.mobile-drawer.open')).toBeFalsy();
    });

    it('should show overlay when drawer is open', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button') as HTMLButtonElement;

      expect(compiled.querySelector('.mobile-drawer-overlay')).toBeFalsy();

      hamburger.click();
      hostFixture.detectChanges();
      expect(compiled.querySelector('.mobile-drawer-overlay')).toBeTruthy();
    });

    it('should close drawer when overlay is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button') as HTMLButtonElement;

      hamburger.click();
      hostFixture.detectChanges();

      const overlay = compiled.querySelector('.mobile-drawer-overlay') as HTMLDivElement;
      overlay.click();
      hostFixture.detectChanges();

      expect(compiled.querySelector('.mobile-drawer.open')).toBeFalsy();
    });

    it('should close drawer when a tab is selected from drawer', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button') as HTMLButtonElement;

      hamburger.click();
      hostFixture.detectChanges();

      const items = Array.from(compiled.querySelectorAll('.mobile-drawer .drawer-item'));
      const traitsItem = items.find((item) => item.textContent?.trim() === 'Traits') as HTMLButtonElement;
      traitsItem.click();
      hostFixture.detectChanges();

      expect(compiled.querySelector('.mobile-drawer.open')).toBeFalsy();
    });
  });

  describe('Tab Selection', () => {
    it('should emit tabSelected when desktop tab is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const tabs = Array.from(compiled.querySelectorAll('.desktop-tabs .folder-tab'));
      const heritageTab = tabs.find((tab) => tab.textContent?.trim() === 'Heritage') as HTMLButtonElement;

      heritageTab.click();
      expect(host.selectedTab).toBe('heritage');
    });

    it('should emit tabSelected when mobile drawer item is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const items = Array.from(compiled.querySelectorAll('.mobile-drawer .drawer-item'));
      const traitsItem = items.find((item) => item.textContent?.trim() === 'Traits') as HTMLButtonElement;

      traitsItem.click();
      expect(host.selectedTab).toBe('traits');
    });

    it('should apply active class to current desktop tab', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const activeTabs = compiled.querySelectorAll('.desktop-tabs .folder-tab.active');
      expect(activeTabs.length).toBe(1);
      expect(activeTabs[0].textContent?.trim()).toBe('Heritage');
    });

    it('should apply active class to current mobile drawer item', () => {
      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const activeItems = compiled.querySelectorAll('.mobile-drawer .drawer-item.active');
      expect(activeItems.length).toBe(1);
      expect(activeItems[0].textContent?.trim()).toBe('Traits');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on desktop tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstTab = compiled.querySelector('.desktop-tabs .folder-tab');
      expect(firstTab?.getAttribute('aria-label')).toBe('Navigate to Class tab');
    });

    it('should have proper ARIA labels on mobile drawer items', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstItem = compiled.querySelector('.mobile-drawer .drawer-item');
      expect(firstItem?.getAttribute('aria-label')).toBe('Navigate to Class tab');
    });

    it('should set aria-current on active desktop tab', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const tabs = Array.from(compiled.querySelectorAll('.desktop-tabs .folder-tab'));
      const heritageTab = tabs.find((tab) => tab.textContent?.trim() === 'Heritage');
      expect(heritageTab?.getAttribute('aria-current')).toBe('page');
    });

    it('should set aria-current on active mobile drawer item', () => {
      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const items = Array.from(compiled.querySelectorAll('.mobile-drawer .drawer-item'));
      const traitsItem = items.find((item) => item.textContent?.trim() === 'Traits');
      expect(traitsItem?.getAttribute('aria-current')).toBe('page');
    });

    it('should have aria-expanded on hamburger button', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button');
      expect(hamburger?.getAttribute('aria-expanded')).toBe('false');

      (hamburger as HTMLButtonElement).click();
      hostFixture.detectChanges();
      expect(hamburger?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-hidden on mobile drawer', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const drawer = compiled.querySelector('.mobile-drawer');
      expect(drawer?.getAttribute('aria-hidden')).toBe('true');

      const hamburger = compiled.querySelector('.hamburger-button') as HTMLButtonElement;
      hamburger.click();
      hostFixture.detectChanges();
      expect(drawer?.getAttribute('aria-hidden')).toBe('false');
    });
  });
});
