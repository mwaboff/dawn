import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { EntitySkeleton } from './entity-skeleton';

/**
 * `@media (prefers-reduced-motion: reduce) { .entity-skeleton-card { animation: none; }
 * .entity-skeleton-shimmer { animation: none; opacity: 0; } }` (entity-skeleton.css) is not
 * asserted here -- jsdom's `getComputedStyle` does not evaluate media-query-gated rules, so a
 * runtime assertion would be unreliable rather than meaningful (see
 * `refine-sheet.spec.ts`'s equivalent doc-comment-only coverage for the same reason).
 */
@Component({
  imports: [EntitySkeleton],
  template: `<app-entity-skeleton [count]="count()" [layout]="layout()" [columns]="columns()" />`,
})
class TestHost {
  count = signal(6);
  layout = signal<'default' | 'wide'>('default');
  columns = signal<'auto' | 2>('auto');
}

describe('EntitySkeleton', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render 6 skeleton cards by default', () => {
    const cards = fixture.nativeElement.querySelectorAll('.entity-skeleton-card');
    expect(cards.length).toBe(6);
  });

  it('should render custom count when provided', () => {
    host.count.set(3);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.entity-skeleton-card');
    expect(cards.length).toBe(3);
  });

  it('should have aria-busy and aria-label on the container', () => {
    const grid = fixture.nativeElement.querySelector('.entity-skeleton-grid');
    expect(grid.getAttribute('aria-busy')).toBe('true');
    expect(grid.getAttribute('aria-label')).toBe('Loading cards');
  });

  it('should mark each card aria-hidden so it is never announced as content', () => {
    const cards = fixture.nativeElement.querySelectorAll('.entity-skeleton-card');
    for (const card of cards) {
      expect(card.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('should render nothing focusable -- the skeleton is decorative only', () => {
    const focusable = fixture.nativeElement.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]',
    );
    expect(focusable.length).toBe(0);
  });

  it('should have staggered animation-delay on each card', () => {
    const cards = fixture.nativeElement.querySelectorAll('.entity-skeleton-card');
    expect(cards[0].style.animationDelay).toBe('0s');
    expect(cards[1].style.animationDelay).toBe('0.12s');
    expect(cards[2].style.animationDelay).toBe('0.24s');
  });

  it('should not apply the wide grid class by default', () => {
    const grid = fixture.nativeElement.querySelector('.entity-skeleton-grid');
    expect(grid.classList.contains('entity-skeleton-grid--wide')).toBe(false);
  });

  it('should apply the wide grid class when layout is wide -- matching EntitySelectionGrid\'s own layout', () => {
    host.layout.set('wide');
    fixture.detectChanges();

    const grid = fixture.nativeElement.querySelector('.entity-skeleton-grid');
    expect(grid.classList.contains('entity-skeleton-grid--wide')).toBe(true);
  });

  it('should render each card with a header and body silhouette', () => {
    const firstCard = fixture.nativeElement.querySelector('.entity-skeleton-card');
    expect(firstCard.querySelector('.entity-skeleton-header')).toBeTruthy();
    expect(firstCard.querySelector('.entity-skeleton-body')).toBeTruthy();
  });

  describe('columns (2-column cap for text-dense cards)', () => {
    it('does not apply the columns-2 class by default (columns="auto")', () => {
      const grid = fixture.nativeElement.querySelector('.entity-skeleton-grid');
      expect(grid.classList.contains('entity-skeleton-grid--columns-2')).toBe(false);
    });

    it('applies the columns-2 class when columns is 2', () => {
      host.columns.set(2);
      fixture.detectChanges();

      const grid = fixture.nativeElement.querySelector('.entity-skeleton-grid');
      expect(grid.classList.contains('entity-skeleton-grid--columns-2')).toBe(true);
    });

    it('lets layout="wide" win over columns="2" -- matches EntitySelectionGrid\'s own precedence', () => {
      host.columns.set(2);
      host.layout.set('wide');
      fixture.detectChanges();

      const grid = fixture.nativeElement.querySelector('.entity-skeleton-grid');
      expect(grid.classList.contains('entity-skeleton-grid--wide')).toBe(true);
      expect(grid.classList.contains('entity-skeleton-grid--columns-2')).toBe(false);
    });
  });
});
