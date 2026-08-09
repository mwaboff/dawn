import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryTab, InventoryTabs } from './inventory-tabs';

@Component({
  template: `
    <app-inventory-tabs
      [activeTab]="activeTab()"
      [counts]="counts()"
      [panelIdPrefix]="panelIdPrefix()"
      (tabSelected)="onTabSelected($event)" />
  `,
  imports: [InventoryTabs],
})
class TestHost {
  activeTab = signal<InventoryTab>('weapons');
  counts = signal<Record<InventoryTab, number>>({ weapons: 1, armor: 0, loot: 3 });
  panelIdPrefix = signal('my-panel');
  selected: InventoryTab[] = [];

  onTabSelected(tab: InventoryTab): void {
    this.selected.push(tab);
  }
}

describe('InventoryTabs', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  function tabs(): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  }

  it('renders three tabs', () => {
    expect(tabs().length).toBe(3);
  });

  it('marks the active tab aria-selected=true and the rest false', () => {
    const buttons = tabs();
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(buttons[1].getAttribute('aria-selected')).toBe('false');
    expect(buttons[2].getAttribute('aria-selected')).toBe('false');
  });

  it('gives the active tab roving tabindex 0 and the rest -1', () => {
    const buttons = tabs();
    expect(buttons[0].tabIndex).toBe(0);
    expect(buttons[1].tabIndex).toBe(-1);
    expect(buttons[2].tabIndex).toBe(-1);
  });

  it('shows a count chip when the count is greater than zero', () => {
    expect(tabs()[0].querySelector('.inventory-tab__count')?.textContent?.trim()).toBe('1');
  });

  it('hides the count chip when the count is zero', () => {
    expect(tabs()[1].querySelector('.inventory-tab__count')).toBeNull();
  });

  it('builds aria-controls from the panelIdPrefix input on the active tab', () => {
    expect(tabs()[0].getAttribute('aria-controls')).toBe('my-panel-weapons');
  });

  it('only exposes aria-controls on the selected tab, leaving the others null', () => {
    const buttons = tabs();
    expect(buttons[0].getAttribute('aria-controls')).toBe('my-panel-weapons');
    expect(buttons[1].getAttribute('aria-controls')).toBeNull();
    expect(buttons[2].getAttribute('aria-controls')).toBeNull();
  });

  it('emits tabSelected with the clicked tab id', () => {
    tabs()[2].click();

    expect(host.selected).toEqual(['loot']);
  });

  it('moves focus to the next tab on ArrowRight without emitting a selection', () => {
    const buttons = tabs();
    buttons[0].focus();

    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(buttons[1]);
    expect(host.selected).toEqual([]);
  });

  it('moves focus to the previous tab on ArrowLeft, wrapping to the last tab from the first', () => {
    const buttons = tabs();
    buttons[0].focus();

    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('selects the focused tab on Enter', () => {
    tabs()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(host.selected).toEqual(['armor']);
  });

  it('selects the focused tab on Space', () => {
    tabs()[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(host.selected).toEqual(['loot']);
  });
});
