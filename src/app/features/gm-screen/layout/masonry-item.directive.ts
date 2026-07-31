import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { MasonryGridDirective } from './masonry-grid.directive';

/**
 * Registers its host with the ancestor grid so a single `ResizeObserver` can measure it. Holds
 * only the mutable `lastSpan` bookkeeping the grid uses to avoid redundant style writes.
 */
@Directive({ selector: '[appMasonryItem]' })
export class MasonryItemDirective implements OnDestroy {
  readonly hostEl = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly grid = inject(MasonryGridDirective);

  /** 0 means "no span written yet". Owned by the grid. */
  lastSpan = 0;

  constructor() {
    this.grid.register(this);
  }

  ngOnDestroy(): void {
    this.grid.unregister(this);
  }
}
