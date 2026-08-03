import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { RunStatRow } from './run-stat-row';

@Component({
  imports: [RunStatRow],
  template: `
    <app-run-stat-row
      [expanded]="expanded()"
      [detailId]="'test-detail'"
      [muted]="muted()"
      [variant]="variant()"
      [density]="density()"
      (toggled)="toggleCount.set(toggleCount() + 1)"
    >
      <span row-identity>Giant Mosquito</span>
      <span row-vitals><b>12</b><small>Difficulty</small></span>
      @if (showIndicator()) {
        <span row-indicator class="test-indicator">skull</span>
      }
      <p row-detail>Detail content</p>
    </app-run-stat-row>
  `,
})
class TestHost {
  expanded = signal(false);
  muted = signal(false);
  variant = signal<'adversary' | 'environment'>('adversary');
  density = signal<'comfortable' | 'compact'>('comfortable');
  showIndicator = signal(false);
  toggleCount = signal(0);
}

describe('RunStatRow', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function toggleBtn(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.stat-row__toggle');
  }

  it('projects identity and vitals content into the toggle button', () => {
    expect(toggleBtn().textContent).toContain('Giant Mosquito');
    expect(toggleBtn().textContent).toContain('12');
    expect(toggleBtn().textContent).toContain('Difficulty');
  });

  it('starts collapsed with aria-expanded false and the detail region hidden', () => {
    expect(toggleBtn().getAttribute('aria-expanded')).toBe('false');
    const detail = fixture.nativeElement.querySelector('#test-detail');
    expect(detail.hidden).toBe(true);
  });

  it('sets aria-controls to an id that exists in the DOM even while collapsed', () => {
    const id = toggleBtn().getAttribute('aria-controls');
    expect(fixture.nativeElement.querySelector(`#${id}`)).toBeTruthy();
  });

  it('emits toggle when clicked, without owning expand/collapse state itself', () => {
    toggleBtn().click();
    expect(host.toggleCount()).toBe(1);
    // The shell doesn't flip its own state -- the host controls `expanded`.
    expect(toggleBtn().getAttribute('aria-expanded')).toBe('false');
  });

  it('reflects the host-controlled expanded state, un-hiding the detail and flipping the chevron', () => {
    host.expanded.set(true);
    fixture.detectChanges();

    expect(toggleBtn().getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#test-detail').hidden).toBe(false);
    expect(fixture.nativeElement.querySelector('.stat-row__chevron').classList.contains('stat-row__chevron--open')).toBe(
      true,
    );
  });

  it('projects detail content only reachable once expanded is set', () => {
    expect(fixture.nativeElement.querySelector('#test-detail').textContent.trim()).toBe('Detail content');
  });

  it('projects an optional row-indicator (e.g. a defeated glyph)', () => {
    host.showIndicator.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.test-indicator')).toBeTruthy();
  });

  it('applies the muted modifier without hiding any content', () => {
    host.muted.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stat-row__item--muted')).toBeTruthy();
    expect(toggleBtn().textContent).toContain('Giant Mosquito');
  });

  it('applies the environment variant modifier', () => {
    host.variant.set('environment');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stat-row__item--environment')).toBeTruthy();
  });

  it('applies the compact density modifier', () => {
    host.density.set('compact');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stat-row__item--compact')).toBeTruthy();
  });
});
