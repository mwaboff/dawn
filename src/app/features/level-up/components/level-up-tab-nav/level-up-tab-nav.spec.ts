import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { LevelUpTabNav } from './level-up-tab-nav';
import { LevelUpTab, LevelUpTabId, ALL_LEVEL_UP_TABS } from '../../models/level-up.model';

@Component({
  template: `
    <app-level-up-tab-nav
      [tabs]="tabs"
      [activeTab]="activeTab()"
      [completedSteps]="completedSteps()"
      (tabSelected)="onTabSelected($event)"
    />
  `,
  imports: [LevelUpTabNav],
})
class TestHost {
  tabs: LevelUpTab[] = ALL_LEVEL_UP_TABS;
  activeTab = signal<LevelUpTabId>('tier-achievements');
  completedSteps = signal<Set<LevelUpTabId>>(new Set());
  selectedTab: LevelUpTabId | null = null;

  onTabSelected(tabId: LevelUpTabId): void {
    this.selectedTab = tabId;
    this.activeTab.set(tabId);
  }
}

describe('LevelUpTabNav', () => {
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
    const tabNav = hostFixture.nativeElement.querySelector('app-level-up-tab-nav');
    expect(tabNav).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should render all 5 chapter markers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = compiled.querySelectorAll('.chapter-marker');
      expect(markers.length).toBe(5);
    });

    it('should display step numbers in marker pips', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const pips = compiled.querySelectorAll('.marker-pip');
      expect(pips[0].textContent?.trim()).toBe('1');
      expect(pips[4].textContent?.trim()).toBe('5');
    });

    it('should display tab labels in marker labels', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const labels = compiled.querySelectorAll('.marker-label');
      expect(labels[0].textContent?.trim()).toBe('Tier Achievements');
      expect(labels[1].textContent?.trim()).toBe('Advancements');
    });

    it('should render the connecting trail line', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const trailLine = compiled.querySelector('.trail-line');
      expect(trailLine).toBeTruthy();
    });
  });

  describe('Tab Selection', () => {
    it('should emit tabSelected when a reachable marker is clicked', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const advancementsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Advancements'
      ) as HTMLButtonElement;

      advancementsMarker.click();
      expect(host.selectedTab).toBe('advancements');
    });

    it('should apply active class to current marker', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const activeMarkers = compiled.querySelectorAll('.chapter-marker.active');
      expect(activeMarkers.length).toBe(1);
      expect(activeMarkers[0].querySelector('.marker-label')?.textContent?.trim()).toBe('Advancements');
    });

    it('should remove active class from previously active marker', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = compiled.querySelectorAll('.chapter-marker');
      const tierMarker = markers[0];
      expect(tierMarker.classList.contains('active')).toBe(false);
    });

    it('should not emit tabSelected when clicking a disabled tab', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const reviewMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Review'
      ) as HTMLButtonElement;

      host.selectedTab = null;
      reviewMarker.click();
      expect(host.selectedTab).toBeNull();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled class to unreachable future tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const reviewMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Review'
      ) as HTMLElement;

      expect(reviewMarker.classList.contains('disabled')).toBe(true);
    });

    it('should not apply disabled class to current and previous tabs', () => {
      host.completedSteps.set(new Set(['tier-achievements', 'advancements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const tierMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Tier Achievements'
      ) as HTMLElement;
      const advancementsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Advancements'
      ) as HTMLElement;

      expect(tierMarker.classList.contains('disabled')).toBe(false);
      expect(advancementsMarker.classList.contains('disabled')).toBe(false);
    });

    it('should set aria-disabled attribute on disabled tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const reviewMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Review'
      ) as HTMLElement;

      expect(reviewMarker.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled on reachable tabs', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const advancementsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Advancements'
      ) as HTMLElement;

      expect(advancementsMarker.getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('Completed State', () => {
    it('should apply completed class to completed tabs', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const tierMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Tier Achievements'
      ) as HTMLElement;

      expect(tierMarker.classList.contains('completed')).toBe(true);
    });

    it('should not apply completed class to incomplete tabs', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const advancementsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Advancements'
      ) as HTMLElement;

      expect(advancementsMarker.classList.contains('completed')).toBe(false);
    });

    it('should display checkmark for completed tabs that are not active', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const tierMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Tier Achievements'
      ) as HTMLElement;
      const pip = tierMarker.querySelector('.marker-pip');

      expect(pip?.textContent?.trim()).toBe('\u2713');
    });

    it('should display number for active tab even if completed', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const tierMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Tier Achievements'
      ) as HTMLElement;
      const pip = tierMarker.querySelector('.marker-pip');

      expect(pip?.textContent?.trim()).toBe('1');
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
      host.completedSteps.set(new Set(['tier-achievements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(false);
    });

    it('should disable next button when current step is not completed', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('should enable next button when current step is completed', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });

    it('should disable next button on last step', () => {
      const allCompleted = new Set<LevelUpTabId>([
        'tier-achievements', 'advancements', 'domain-card', 'domain-trades', 'review',
      ]);
      host.completedSteps.set(allCompleted);
      host.activeTab.set('review');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);
    });

    it('should navigate to next step when next button is clicked', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;

      nextBtn.click();
      expect(host.selectedTab).toBe('advancements');
    });

    it('should navigate to previous step when previous button is clicked', () => {
      host.completedSteps.set(new Set(['tier-achievements']));
      host.activeTab.set('advancements');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevBtn = compiled.querySelector('.arrow-prev') as HTMLButtonElement;

      prevBtn.click();
      expect(host.selectedTab).toBe('tier-achievements');
    });

    it('should display the current step label in the indicator', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const indicator = compiled.querySelector('.step-indicator');
      expect(indicator?.textContent?.trim()).toBe('Tier Achievements');
    });

    it('should update indicator label when step changes', () => {
      host.completedSteps.set(new Set(['tier-achievements', 'advancements']));
      host.activeTab.set('domain-card');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const indicator = compiled.querySelector('.step-indicator');
      expect(indicator?.textContent?.trim()).toBe('Domain Card');
    });

    it('should show next step label in next button', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextText = compiled.querySelector('.arrow-next .arrow-text');
      expect(nextText?.textContent?.trim()).toBe('Advancements');
    });

    it('should show previous step label in previous button', () => {
      host.completedSteps.set(new Set(['tier-achievements', 'advancements']));
      host.activeTab.set('domain-card');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const prevText = compiled.querySelector('.arrow-prev .arrow-text');
      expect(prevText?.textContent?.trim()).toBe('Advancements');
    });

    it('should navigate sequentially through all steps when all are completed', () => {
      const allCompleted = new Set<LevelUpTabId>([
        'tier-achievements', 'advancements', 'domain-card', 'domain-trades',
      ]);
      host.completedSteps.set(allCompleted);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const nextBtn = compiled.querySelector('.arrow-next') as HTMLButtonElement;
      const expectedOrder: LevelUpTabId[] = [
        'advancements', 'domain-card', 'domain-trades', 'review',
      ];

      expectedOrder.forEach((expectedTab) => {
        nextBtn.click();
        hostFixture.detectChanges();
        expect(host.activeTab()).toBe(expectedTab);
      });
    });
  });

  describe('Domain Trades Always Reachable', () => {
    it('should not disable domain-trades tab even when prior steps are incomplete', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const tradesMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Card Trades'
      ) as HTMLElement;

      expect(tradesMarker.classList.contains('disabled')).toBe(false);
    });

    it('should allow clicking domain-trades tab when prior steps are incomplete', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const tradesMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Card Trades'
      ) as HTMLButtonElement;

      tradesMarker.click();
      expect(host.selectedTab).toBe('domain-trades');
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
      expect(markers.length).toBe(5);
    });

    it('should have descriptive aria-labels with step numbers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstMarker = compiled.querySelector('.chapter-marker');
      expect(firstMarker?.getAttribute('aria-label')).toBe('Step 1: Tier Achievements');
    });

    it('should set aria-selected on active marker', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstMarker = compiled.querySelector('.chapter-marker');
      expect(firstMarker?.getAttribute('aria-selected')).toBe('true');
    });

    it('should not set aria-selected on inactive markers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const markers = Array.from(compiled.querySelectorAll('.chapter-marker'));
      const advancementsMarker = markers.find(
        (m) => m.querySelector('.marker-label')?.textContent?.trim() === 'Advancements'
      );
      expect(advancementsMarker?.getAttribute('aria-selected')).toBe('false');
    });

    it('should have aria-controls linking to tab panel', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const firstMarker = compiled.querySelector('.chapter-marker');
      expect(firstMarker?.getAttribute('aria-controls')).toBe('lu-panel-tier-achievements');
    });

    it('should have an accessible label on the nav element', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const nav = compiled.querySelector('.chapter-trail');
      expect(nav?.getAttribute('aria-label')).toBe('Level-up steps');
    });
  });
});
