import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { CardSkeleton } from './card-skeleton';

@Component({
  imports: [CardSkeleton],
  template: `<app-card-skeleton [count]="count()" />`,
})
class TestHost {
  count = signal(9);
}

describe('CardSkeleton', () => {
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

  it('should render default 9 skeleton cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(9);
  });

  it('should render custom count when provided', () => {
    host.count.set(3);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(3);
  });

  it('should have aria-busy on container', () => {
    const grid = fixture.nativeElement.querySelector('.skeleton-grid');
    expect(grid.getAttribute('aria-busy')).toBe('true');
  });

  it('should have aria-label for accessibility', () => {
    const grid = fixture.nativeElement.querySelector('.skeleton-grid');
    expect(grid.getAttribute('aria-label')).toBe('Loading cards');
  });

  it('should have staggered animation-delay on each card', () => {
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards[0].style.animationDelay).toBe('0s');
    expect(cards[1].style.animationDelay).toBe('0.12s');
    expect(cards[2].style.animationDelay).toBe('0.24s');
  });

  it('should mark each card as aria-hidden', () => {
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    for (const card of cards) {
      expect(card.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
