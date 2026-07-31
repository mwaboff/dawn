import {
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MasonryItemDirective } from './masonry-item.directive';

/**
 * CSS-grid masonry: the grid uses tiny fixed rows and each item is given a `grid-row-end` span
 * matching its measured height.
 *
 * The grid owns the single `ResizeObserver` for the whole board -- one observer watching N items
 * is far cheaper than N observers, and it lets every item's span be written inside one animation
 * frame so the browser lays out once instead of N times.
 */
@Directive({ selector: '[appMasonryGrid]' })
export class MasonryGridDirective implements OnDestroy {
  /** Fallbacks only; the real values are read from computed style so a media query can't desync. */
  readonly rowHeight = input(4);
  readonly gap = input(16);
  readonly disabled = input(false);

  readonly hostEl = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly items = new Set<MasonryItemDirective>();
  private ro: ResizeObserver | null = null;
  private rafId: number | null = null;
  private destroyed = false;

  constructor() {
    if (this.isBrowser && typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.schedule());
      this.ro.observe(this.hostEl);
      // Web fonts land after first paint and change every panel's height.
      document.fonts?.ready.then(() => this.schedule());
    }
    effect(() => {
      this.disabled();
      this.schedule();
    });
  }

  register(item: MasonryItemDirective): void {
    this.items.add(item);
    this.ro?.observe(item.hostEl);
    this.schedule();
  }

  unregister(item: MasonryItemDirective): void {
    this.items.delete(item);
    this.ro?.unobserve(item.hostEl);
  }

  /** Coalesces the burst of observer callbacks a single reflow produces into one recalculation. */
  schedule(): void {
    // `document.fonts.ready` resolves ~200ms after first paint and cannot be cancelled, so it can
    // fire against a grid the user has already navigated away from.
    if (!this.isBrowser || this.destroyed || this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.recalcAll();
    });
  }

  /** Public because the grid component must re-measure after a drop moves nodes between columns. */
  recalcAll(): void {
    if (this.disabled()) {
      for (const item of this.items) {
        item.lastSpan = 0;
        item.hostEl.style.removeProperty('grid-row-end');
      }
      return;
    }

    const style = getComputedStyle(this.hostEl);
    const rowH = parseFloat(style.gridAutoRows) || this.rowHeight();
    const gap = parseFloat(style.rowGap) || this.gap();

    for (const item of this.items) {
      const height = item.hostEl.getBoundingClientRect().height;
      // Zero means the panel is filtered out (`display: none`); keep its last span so it comes
      // back at the right size. A collapsed panel still measures its header, which is real.
      if (height === 0) continue;
      const span = Math.max(1, Math.ceil((height + gap) / (rowH + gap)));
      // Writing only on change is what stops the observer from re-firing into a loop.
      if (span !== item.lastSpan) {
        item.lastSpan = span;
        item.hostEl.style.gridRowEnd = `span ${span}`;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.ro?.disconnect();
    this.ro = null;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}
