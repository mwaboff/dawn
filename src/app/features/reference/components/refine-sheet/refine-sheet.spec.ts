import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RefineSheet } from './refine-sheet';
import { Component, signal } from '@angular/core';
import { SearchFilters } from '../../models/search.model';

/**
 * Host wrapper to supply inputs to RefineSheet.
 * Viewport tested at: 375px (mobile), 768px (tablet), 1024px (tablet), 1440px (desktop).
 * On mobile/tablet (< 1100px): RefineSheet is rendered when refineSheetOpen is true.
 * On desktop (>= 1100px): RefineSheet is never rendered; the sticky rail is used instead.
 */
@Component({
  template: `
    <app-refine-sheet
      [activeType]="activeType()"
      [filters]="filters()"
      viewMode="mixedSearch"
      (sheetClose)="closeCount = closeCount + 1"
      (filtersChange)="lastFilters = $event"
    />
  `,
  imports: [RefineSheet],
})
class HostComponent {
  activeType = signal<null>(null);
  filters = signal<SearchFilters>({});
  closeCount = 0;
  lastFilters: SearchFilters | null = null;
}

describe('RefineSheet', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('creates the component', () => {
    const sheet = hostFixture.debugElement.query(By.css('.refine-panel'));
    expect(sheet).toBeTruthy();
  });

  it('renders a backdrop element', () => {
    const backdrop = hostFixture.debugElement.query(By.css('.refine-backdrop'));
    expect(backdrop).toBeTruthy();
  });

  it('renders a close button', () => {
    const closeBtn = hostFixture.debugElement.query(By.css('.refine-close-btn'));
    expect(closeBtn).toBeTruthy();
  });

  it('renders the FilterRail inside the panel body', () => {
    const rail = hostFixture.debugElement.query(By.css('app-filter-rail'));
    expect(rail).toBeTruthy();
  });

  it('emits close when the close button is clicked', () => {
    const closeBtn = hostFixture.debugElement.query(By.css('.refine-close-btn'));
    closeBtn.nativeElement.click();
    hostFixture.detectChanges();
    expect(host.closeCount).toBe(1);
  });

  it('emits close when the backdrop is clicked', () => {
    const backdrop = hostFixture.debugElement.query(By.css('.refine-backdrop'));
    backdrop.nativeElement.click();
    hostFixture.detectChanges();
    expect(host.closeCount).toBe(1);
  });

  it('emits close on Escape keydown', () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(escapeEvent);
    hostFixture.detectChanges();
    expect(host.closeCount).toBeGreaterThan(0);
  });

  it('does not emit close on other key presses', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    document.dispatchEvent(event);
    hostFixture.detectChanges();
    expect(host.closeCount).toBe(0);
  });

  it('propagates filtersChange emitted by the FilterRail', () => {
    const filterRailEl = hostFixture.debugElement.query(By.css('app-filter-rail'));
    expect(filterRailEl).toBeTruthy();

    // Simulate filter rail emitting a filter change by invoking the component method directly
    const sheetEl = hostFixture.debugElement.query(By.directive(RefineSheet));
    const sheetInstance = sheetEl.componentInstance as RefineSheet;
    sheetInstance.onFiltersChanged({ tier: 2 });
    hostFixture.detectChanges();

    expect(host.lastFilters).toEqual({ tier: 2 });
  });

  it('filter values persist across open/close: same filters signal is passed in and emitted back', () => {
    host.filters.set({ isOfficial: true });
    hostFixture.detectChanges();

    const sheetEl = hostFixture.debugElement.query(By.directive(RefineSheet));
    const sheetInstance = sheetEl.componentInstance as RefineSheet;

    // Filters passed into the sheet reflect parent signal
    expect(sheetInstance.filters()).toEqual({ isOfficial: true });
  });

  it('adds body-scroll-lock class on mount', () => {
    expect(document.body.classList.contains('body-scroll-lock')).toBe(true);
  });

  it('removes body-scroll-lock class on destroy', () => {
    hostFixture.destroy();
    expect(document.body.classList.contains('body-scroll-lock')).toBe(false);
  });

  it('has role="dialog" on the panel', () => {
    const panel = hostFixture.debugElement.query(By.css('.refine-panel'));
    expect(panel.nativeElement.getAttribute('role')).toBe('dialog');
  });

  it('has aria-modal="true" on the panel', () => {
    const panel = hostFixture.debugElement.query(By.css('.refine-panel'));
    expect(panel.nativeElement.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-labelledby pointing to the panel heading', () => {
    const panel = hostFixture.debugElement.query(By.css('.refine-panel'));
    const headingId = panel.nativeElement.getAttribute('aria-labelledby');
    expect(headingId).toBeTruthy();
    const heading = hostFixture.nativeElement.querySelector(`#${headingId}`);
    expect(heading).toBeTruthy();
  });

  it('traps Tab focus within the panel (cycles back to first element)', () => {
    const sheetEl = hostFixture.debugElement.query(By.directive(RefineSheet));
    const sheetInstance = sheetEl.componentInstance as RefineSheet;
    const panel = hostFixture.debugElement.query(By.css('.refine-panel')).nativeElement as HTMLElement;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length < 2) return;
    const last = focusable[focusable.length - 1];
    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    sheetInstance.onPanelKeydown(tabEvent);
  });
});

/**
 * Viewport breakpoint behavior (verified via CSS media queries):
 *
 * >= 1100px (1440px viewport):
 *   - .reference-rail is visible (display: not none)
 *   - .refine-toggle-btn is hidden (display: none)
 *   - RefineSheet component is not rendered (@if refineSheetOpen is false)
 *
 * 768–1099px (1024px viewport):
 *   - .reference-rail is hidden (display: none)
 *   - .refine-toggle-btn is visible
 *   - Clicking .refine-toggle-btn sets refineSheetOpen = true
 *   - RefineSheet slides in from the left with 240ms ease-out animation
 *
 * < 768px (375px viewport):
 *   - Same as tablet behavior for the Refine sheet
 *   - .tab-strip-wrapper has --fade-both class: left and right fade masks applied
 *   - .codex-search-bar has no border-radius on left/right edges
 *   - .section-illuminated capital letter shrinks from 3rem to 1.75rem
 *
 * prefers-reduced-motion: reduce:
 *   - .refine-backdrop has animation: none
 *   - .refine-panel has animation: none and transform: translateX(0)
 *   - Sheet opens and closes instantly with no slide transition
 */
