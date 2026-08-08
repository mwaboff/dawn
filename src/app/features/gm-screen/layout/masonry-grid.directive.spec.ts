import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MasonryGridDirective } from './masonry-grid.directive';
import { MasonryItemDirective } from './masonry-item.directive';
import {
  ResizeObserverStubHandle,
  installResizeObserverStub,
} from '../../../shared/testing/resize-observer.stub';

@Component({
  selector: 'app-masonry-host',
  imports: [MasonryGridDirective, MasonryItemDirective],
  template: `
    <div appMasonryGrid [disabled]="disabled()">
      @for (h of heights(); track $index) {
        <div appMasonryItem></div>
      }
    </div>
  `,
})
class MasonryHost {
  readonly heights = signal<number[]>([100, 250]);
  readonly disabled = signal(false);
  readonly grid = viewChild.required(MasonryGridDirective);
}

/** jsdom always measures 0, so heights are injected per element. */
function stubHeights(root: HTMLElement, heights: readonly number[]): HTMLElement[] {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[appMasonryItem]'));
  els.forEach((el, i) => {
    el.getBoundingClientRect = () => ({ height: heights[i] }) as DOMRect;
  });
  return els;
}

describe('MasonryGridDirective', () => {
  let stub: ResizeObserverStubHandle;

  beforeEach(() => {
    stub = installResizeObserverStub();
  });
  afterEach(() => stub.restore());

  function mount(heights: number[]) {
    TestBed.configureTestingModule({ imports: [MasonryHost] });
    const fixture = TestBed.createComponent(MasonryHost);
    fixture.componentInstance.heights.set(heights);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const els = stubHeights(root, heights);
    return { fixture, root, els, grid: fixture.componentInstance.grid() };
  }

  it('spans each item by ceil((height + gap) / (rowHeight + gap))', () => {
    // Defaults: rowHeight 4, gap 16 -> (100 + 16) / 20 = 5.8 -> 6; (250 + 16) / 20 = 13.3 -> 14.
    const { els, grid } = mount([100, 250]);
    grid.recalcAll();
    expect(els[0].style.gridRowEnd).toBe('span 6');
    expect(els[1].style.gridRowEnd).toBe('span 14');
  });

  it('never spans less than one row', () => {
    const { els, grid } = mount([1]);
    grid.recalcAll();
    expect(els[0].style.gridRowEnd).toBe('span 1');
  });

  it('does not rewrite the style when the span is unchanged', () => {
    const { els, grid } = mount([100]);
    grid.recalcAll();
    let writes = 0;
    Object.defineProperty(els[0].style, 'gridRowEnd', {
      get: () => 'span 6',
      set: () => writes++,
      configurable: true,
    });
    grid.recalcAll();
    grid.recalcAll();
    // Rewriting an identical span is what makes the ResizeObserver re-fire into a loop.
    expect(writes).toBe(0);
  });

  it('skips zero-height (filtered out) items and keeps their last span', () => {
    const { els, grid } = mount([100]);
    grid.recalcAll();
    expect(els[0].style.gridRowEnd).toBe('span 6');

    els[0].getBoundingClientRect = () => ({ height: 0 }) as DOMRect;
    grid.recalcAll();
    expect(els[0].style.gridRowEnd).toBe('span 6');
  });

  it('clears the span while disabled', () => {
    const { fixture, els, grid } = mount([100]);
    grid.recalcAll();
    expect(els[0].style.gridRowEnd).toBe('span 6');

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    grid.recalcAll();
    expect(els[0].style.gridRowEnd).toBe('');
  });

  it('observes the host and every registered item through one observer', () => {
    const { root } = mount([100, 250]);
    expect(stub.instances.length).toBe(1);
    expect(stub.instances[0].observed.size).toBe(3);
    expect(stub.instances[0].observed.has(root.querySelector('[appMasonryGrid]')!)).toBe(true);
  });

  it('unobserves an item that is removed', () => {
    const { fixture } = mount([100, 250]);
    fixture.componentInstance.heights.set([100]);
    fixture.detectChanges();
    expect(stub.instances[0].observed.size).toBe(2);
  });

  it('disconnects the observer on destroy', () => {
    const { fixture } = mount([100]);
    fixture.destroy();
    expect(stub.instances[0].disconnected).toBe(true);
  });
});
