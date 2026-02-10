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
    it('should render all 9 chapter markers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = compiled.querySelectorAll('.chapter-marker');
      expect(markers.length).toBe(9);
    });

    it('should display step numbers in marker pips', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const pips = compiled.querySelectorAll('.marker-pip');
      expect(pips[0].textContent?.trim()).toBe('1');
      expect(pips[8].textContent?.trim()).toBe('9');
    });

    it('should display tab labels in marker labels', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const labels = compiled.querySelectorAll('.marker-label');
      expect(labels[0].textContent?.trim()).toBe('Class');
      expect(labels[1].textContent?.trim()).toBe('Heritage');
    });

    it('should render the connecting trail line', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const trailLine = compiled.querySelector('.trail-line');
      expect(trailLine).toBeTruthy();
    });
  });

  describe('Tab Selection', () => {
    it('should emit tabSelected when a marker is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const heritageMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Heritage'
      ) as HTMLButtonElement;

      heritageMarker.click();
      expect(host.selectedTab).toBe('heritage');
    });

    it('should apply active class to current marker', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const activeMarkers = compiled.querySelectorAll('.chapter-marker.active');
      expect(activeMarkers.length).toBe(1);
      expect(activeMarkers[0].querySelector('.marker-label')?.textContent?.trim()).toBe('Heritage');
    });

    it('should remove active class from previously active marker', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = compiled.querySelectorAll('.chapter-marker');
      const classMarker = markers[0];
      expect(classMarker.classList.contains('active')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have tablist role on nav container', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nav = compiled.querySelector('[role="tablist"]');
      expect(nav).toBeTruthy();
    });

    it('should have tab role on each marker', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = compiled.querySelectorAll('[role="tab"]');
      expect(markers.length).toBe(9);
    });

    it('should have descriptive aria-labels with step numbers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstMarker = compiled.querySelector('.chapter-marker');
      expect(firstMarker?.getAttribute('aria-label')).toBe('Step 1: Class');
    });

    it('should set aria-selected on active marker', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const heritageMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Heritage'
      );
      expect(heritageMarker?.getAttribute('aria-selected')).toBe('true');
    });

    it('should not set aria-selected on inactive markers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const heritageMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Heritage'
      );
      expect(heritageMarker?.getAttribute('aria-selected')).toBe('false');
    });

    it('should have aria-controls linking to tab panel', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstMarker = compiled.querySelector('.chapter-marker');
      expect(firstMarker?.getAttribute('aria-controls')).toBe('panel-class');
    });

    it('should have an accessible label on the nav element', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nav = compiled.querySelector('.chapter-trail');
      expect(nav?.getAttribute('aria-label')).toBe('Character creation steps');
    });

    it('should have aria-label on next button referencing next step', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next');
      expect(nextBtn?.getAttribute('aria-label')).toBe('Go to next step: Heritage');
    });

    it('should have aria-label on previous button referencing previous step', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev');
      expect(prevBtn?.getAttribute('aria-label')).toBe('Go to previous step: Class');
    });
  });

  describe('Arrow Navigation', () => {
    it('should render previous and next arrow buttons', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.arrow-prev')).toBeTruthy();
      expect(compiled.querySelector('.arrow-next')).toBeTruthy();
    });

    it('should disable previous button on first step', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });

    it('should enable previous button when not on first step', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(false);
    });

    it('should disable next button on last step', () => {
      host.activeTab.set('connections');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('should enable next button when not on last step', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });

    it('should navigate to next step when next button is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      nextBtn.click();
      expect(host.selectedTab).toBe('heritage');
    });

    it('should navigate to previous step when previous button is clicked', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;

      prevBtn.click();
      expect(host.selectedTab).toBe('class');
    });

    it('should display the current step label in the indicator', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const indicator = compiled.querySelector('.step-indicator');
      expect(indicator?.textContent?.trim()).toBe('Class');
    });

    it('should update indicator label when step changes', () => {
      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const indicator = compiled.querySelector('.step-indicator');
      expect(indicator?.textContent?.trim()).toBe('Traits');
    });

    it('should show next step label in next button', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextText = compiled.querySelector('.arrow-next .arrow-text');
      expect(nextText?.textContent?.trim()).toBe('Heritage');
    });

    it('should show previous step label in previous button', () => {
      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevText = compiled.querySelector('.arrow-prev .arrow-text');
      expect(prevText?.textContent?.trim()).toBe('Heritage');
    });

    it('should not navigate when previous is clicked on first step', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;

      host.selectedTab = null;
      prevBtn.click();
      expect(host.selectedTab).toBeNull();
    });

    it('should not navigate when next is clicked on last step', () => {
      host.activeTab.set('connections');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      host.selectedTab = null;
      nextBtn.click();
      expect(host.selectedTab).toBeNull();
    });

    it('should navigate sequentially through all steps', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      const expectedOrder: TabId[] = [
        'heritage', 'traits', 'additional-info', 'starting-equipment',
        'background', 'experiences', 'domain-cards', 'connections',
      ];

      expectedOrder.forEach((expectedTab) => {
        nextBtn.click();
        hostFixture.detectChanges();
        expect(host.activeTab()).toBe(expectedTab);
      });
    });
  });

  describe('Auto-scroll', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should call scrollIntoView on the active tab when activeTab changes', () => {
      const scrollIntoViewMock = vi.fn();

      host.activeTab.set('heritage');
      hostFixture.detectChanges();
      vi.advanceTimersByTime(0);

      const compiled = hostFixture.nativeElement as HTMLElement;
      const heritageTab = compiled.querySelector('#tab-heritage') as HTMLElement;
      heritageTab.scrollIntoView = scrollIntoViewMock;

      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const traitsTab = compiled.querySelector('#tab-traits') as HTMLElement;
      traitsTab.scrollIntoView = scrollIntoViewMock;

      vi.advanceTimersByTime(0);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });

    it('should scroll when navigating via the next arrow', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      vi.advanceTimersByTime(0);

      const scrollIntoViewMock = vi.fn();
      const heritageTab = compiled.querySelector('#tab-heritage') as HTMLElement;
      heritageTab.scrollIntoView = scrollIntoViewMock;

      nextBtn.click();
      hostFixture.detectChanges();
      vi.advanceTimersByTime(0);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });

    it('should scroll when navigating via the previous arrow', () => {
      host.activeTab.set('heritage');
      hostFixture.detectChanges();
      vi.advanceTimersByTime(0);

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;

      const scrollIntoViewMock = vi.fn();
      const classTab = compiled.querySelector('#tab-class') as HTMLElement;
      classTab.scrollIntoView = scrollIntoViewMock;

      prevBtn.click();
      hostFixture.detectChanges();
      vi.advanceTimersByTime(0);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });

    it('should not error when the scroll container is not available', () => {
      expect(() => {
        host.activeTab.set('heritage');
        hostFixture.detectChanges();
        vi.advanceTimersByTime(0);
      }).not.toThrow();
    });
  });

  describe('Trail Line', () => {
    it('should set trail line width based on scroll container', async () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const trailLine = compiled.querySelector('.trail-line') as HTMLElement;

      await new Promise(resolve => setTimeout(resolve, 10));

      const widthValue = trailLine.style.width;
      expect(widthValue).toBeTruthy();
      expect(widthValue).toMatch(/^\d+px$/);
    });

    it('should update trail line width when component initializes', async () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const trailLine = compiled.querySelector('.trail-line') as HTMLElement;

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(trailLine.style.width).not.toBe('');
    });
  });
});
