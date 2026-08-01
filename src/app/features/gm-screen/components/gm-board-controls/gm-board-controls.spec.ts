import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GmBoardControls } from './gm-board-controls';

describe('GmBoardControls', () => {
  let fixture: ComponentFixture<GmBoardControls>;
  let host: HTMLElement;

  const button = (label: string) =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('.board-bar__btn')).find(
      b => b.textContent?.trim() === label,
    )!;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GmBoardControls] });
    fixture = TestBed.createComponent(GmBoardControls);
    fixture.componentRef.setInput('filter', '');
    fixture.componentRef.setInput('matchCount', 24);
    fixture.componentRef.setInput('totalCount', 24);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('reports the panel total when nothing is being filtered', () => {
    expect(host.querySelector('.board-bar__count')?.textContent?.trim()).toBe('24 panels');
  });

  it('reports how many panels survive an active filter', () => {
    fixture.componentRef.setInput('filter', 'stress');
    fixture.componentRef.setInput('matchCount', 3);
    fixture.detectChanges();
    expect(host.querySelector('.board-bar__count')?.textContent?.trim()).toBe('3 of 24 panels');
  });

  it('emits what the user typed', () => {
    let emitted: string | null = null;
    fixture.componentInstance.filterChange.subscribe(value => (emitted = value));

    const input = host.querySelector<HTMLInputElement>('.board-bar__input')!;
    input.value = 'thresholds';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toBe('thresholds');
  });

  it('emits the bulk collapse and reset actions', () => {
    const fired: string[] = [];
    fixture.componentInstance.expandAll.subscribe(() => fired.push('expand'));
    fixture.componentInstance.collapseAll.subscribe(() => fired.push('collapse'));
    fixture.componentInstance.resetLayout.subscribe(() => fired.push('reset'));

    button('Expand all').click();
    button('Collapse all').click();
    button('Reset layout').click();

    expect(fired).toEqual(['expand', 'collapse', 'reset']);
  });
});
