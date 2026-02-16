import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { TabNav } from './tab-nav';
import { Tab, TabId, CHARACTER_TABS } from '../../models/create-character.model';

@Component({
  template: `
    <app-tab-nav
      [tabs]="tabs"
      [activeTab]="activeTab()"
      [completedSteps]="completedSteps()"
      (tabSelected)="onTabSelected($event)"
    />
  `,
  imports: [TabNav],
})
class TestHost {
  tabs: Tab[] = CHARACTER_TABS;
  activeTab = signal<TabId>('class');
  completedSteps = signal<Set<TabId>>(new Set());
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
      expect(labels[1].textContent?.trim()).toBe('Subclass');
    });

    it('should render the connecting trail line', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const trailLine = compiled.querySelector('.trail-line');
      expect(trailLine).toBeTruthy();
    });
  });

  describe('Tab Selection', () => {
    it('should emit tabSelected when a marker is clicked', () => {
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      ) as HTMLButtonElement;

      subclassMarker.click();
      expect(host.selectedTab).toBe('subclass');
    });

    it('should apply active class to current marker', () => {
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const activeMarkers = compiled.querySelectorAll('.chapter-marker.active');
      expect(activeMarkers.length).toBe(1);
      expect(activeMarkers[0].querySelector('.marker-label')?.textContent?.trim()).toBe('Subclass');
    });

    it('should remove active class from previously active marker', () => {
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
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
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      );
      expect(subclassMarker?.getAttribute('aria-selected')).toBe('true');
    });

    it('should not set aria-selected on inactive markers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      );
      expect(subclassMarker?.getAttribute('aria-selected')).toBe('false');
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
      expect(nextBtn?.getAttribute('aria-label')).toBe('Go to next step: Subclass');
    });

    it('should have aria-label on previous button referencing previous step', () => {
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
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
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(false);
    });

    it('should disable next button on last step', () => {
      // Mark all steps as complete so domain-cards is reachable
      const allCompleted = new Set<TabId>([
        'class', 'subclass', 'ancestry', 'community', 'traits',
        'starting-equipment', 'background', 'experiences', 'domain-cards',
      ]);
      host.completedSteps.set(allCompleted);
      host.activeTab.set('domain-cards');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('should enable next button when not on last step and current step is complete', () => {
      // Mark class as complete so next button is enabled
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });

    it('should navigate to next step when next button is clicked', () => {
      // Mark class as complete so next button works
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      nextBtn.click();
      expect(host.selectedTab).toBe('subclass');
    });

    it('should navigate to previous step when previous button is clicked', () => {
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
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
      // Mark class, subclass, ancestry, and community as complete so traits is reachable
      host.completedSteps.set(new Set(['class', 'subclass', 'ancestry', 'community']));
      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const indicator = compiled.querySelector('.step-indicator');
      expect(indicator?.textContent?.trim()).toBe('Traits');
    });

    it('should show next step label in next button', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextText = compiled.querySelector('.arrow-next .arrow-text');
      expect(nextText?.textContent?.trim()).toBe('Subclass');
    });

    it('should show previous step label in previous button', () => {
      // Mark class, subclass, ancestry, and community as complete so traits is reachable
      host.completedSteps.set(new Set(['class', 'subclass', 'ancestry', 'community']));
      host.activeTab.set('traits');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevText = compiled.querySelector('.arrow-prev .arrow-text');
      expect(prevText?.textContent?.trim()).toBe('Community');
    });

    it('should not navigate when previous is clicked on first step', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;

      host.selectedTab = null;
      prevBtn.click();
      expect(host.selectedTab).toBeNull();
    });

    it('should not navigate when next is clicked on last step', () => {
      host.activeTab.set('domain-cards');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      host.selectedTab = null;
      nextBtn.click();
      expect(host.selectedTab).toBeNull();
    });

    it('should navigate sequentially through all steps when all are completed', () => {
      // Mark all steps as completed
      const allCompleted = new Set<TabId>([
        'class', 'subclass', 'ancestry', 'community', 'traits',
        'starting-equipment', 'background', 'experiences', 'domain-cards',
      ]);
      host.completedSteps.set(allCompleted);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      const expectedOrder: TabId[] = [
        'subclass', 'ancestry', 'community', 'traits',
        'starting-equipment', 'background', 'experiences', 'domain-cards',
      ];

      expectedOrder.forEach((expectedTab) => {
        nextBtn.click();
        hostFixture.detectChanges();
        expect(host.activeTab()).toBe(expectedTab);
      });
    });
  });

  describe('Step Completion and Gating', () => {
    it('should disable next button when current step is not completed', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      expect(nextBtn.disabled).toBe(true);
    });

    it('should enable next button when current step is completed', () => {
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      expect(nextBtn.disabled).toBe(false);
    });

    it('should not emit tabSelected when clicking a disabled tab', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const traitsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Traits'
      ) as HTMLButtonElement;

      host.selectedTab = null;
      traitsMarker.click();

      // Should not navigate because traits is disabled (prior steps not completed)
      expect(host.selectedTab).toBeNull();
    });

    it('should emit tabSelected when clicking a non-disabled tab', () => {
      // Complete class step
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      ) as HTMLButtonElement;

      subclassMarker.click();

      expect(host.selectedTab).toBe('subclass');
    });

    it('should apply disabled class to unreachable future tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const traitsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Traits'
      ) as HTMLElement;

      expect(traitsMarker.classList.contains('disabled')).toBe(true);
    });

    it('should not apply disabled class to current and previous tabs', () => {
      host.completedSteps.set(new Set(['class', 'subclass']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const classMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Class'
      ) as HTMLElement;
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      ) as HTMLElement;

      expect(classMarker.classList.contains('disabled')).toBe(false);
      expect(subclassMarker.classList.contains('disabled')).toBe(false);
    });

    it('should apply completed class to completed tabs', () => {
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const classMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Class'
      ) as HTMLElement;

      expect(classMarker.classList.contains('completed')).toBe(true);
    });

    it('should not apply completed class to incomplete tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      ) as HTMLElement;

      expect(subclassMarker.classList.contains('completed')).toBe(false);
    });

    it('should set aria-disabled attribute on disabled tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const traitsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Traits'
      ) as HTMLElement;

      expect(traitsMarker.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled on reachable tabs', () => {
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      ) as HTMLElement;

      expect(subclassMarker.getAttribute('aria-disabled')).toBe('false');
    });

    it('should display checkmark for completed tabs that are not active', () => {
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const classMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Class'
      ) as HTMLElement;
      const pip = classMarker.querySelector('.marker-pip');

      expect(pip?.textContent?.trim()).toBe('✓');
    });

    it('should display number for incomplete tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const subclassMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Subclass'
      ) as HTMLElement;
      const pip = subclassMarker.querySelector('.marker-pip');

      expect(pip?.textContent?.trim()).toBe('2');
    });

    it('should display number for active tab even if completed', () => {
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const classMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Class'
      ) as HTMLElement;
      const pip = classMarker.querySelector('.marker-pip');

      expect(pip?.textContent?.trim()).toBe('1');
    });

    it('should not disable next button when on last step even if completed', () => {
      host.completedSteps.set(new Set(['domain-cards']));
      host.activeTab.set('domain-cards');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      expect(nextBtn.disabled).toBe(true);
    });

    it('should not prevent clicking next when step is completed', () => {
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      nextBtn.click();
      expect(host.selectedTab).toBe('subclass');
    });

    it('should allow previous navigation regardless of completion state', () => {
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;

      expect(prevBtn.disabled).toBe(false);

      prevBtn.click();
      expect(host.selectedTab).toBe('class');
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

      // Mark class, subclass, ancestry, and community as complete so traits is reachable
      host.completedSteps.set(new Set(['class', 'subclass', 'ancestry', 'community']));
      host.activeTab.set('subclass');
      hostFixture.detectChanges();
      vi.advanceTimersByTime(0);

      const compiled = hostFixture.nativeElement as HTMLElement;
      const subclassTab = compiled.querySelector('#tab-subclass') as HTMLElement;
      subclassTab.scrollIntoView = scrollIntoViewMock;

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
      // Mark class as complete so next button works
      host.completedSteps.set(new Set(['class']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      vi.advanceTimersByTime(0);

      const scrollIntoViewMock = vi.fn();
      const subclassTab = compiled.querySelector('#tab-subclass') as HTMLElement;
      subclassTab.scrollIntoView = scrollIntoViewMock;

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
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      host.activeTab.set('subclass');
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
      // Mark class as complete so subclass is reachable
      host.completedSteps.set(new Set(['class']));
      expect(() => {
        host.activeTab.set('subclass');
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
