import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ItemFilterBar, ItemFilterType } from './item-filter-bar';

describe('ItemFilterBar', () => {
  let fixture: ComponentFixture<ItemFilterBar>;
  let component: ItemFilterBar;
  let selected: ItemFilterType[];
  let customToggles: boolean[];

  function chips(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[role="radio"]'));
  }

  function customSwitch(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('[role="switch"]') as HTMLButtonElement;
  }

  beforeEach(async () => {
    selected = [];
    customToggles = [];

    await TestBed.configureTestingModule({ imports: [ItemFilterBar] }).compileComponents();

    fixture = TestBed.createComponent(ItemFilterBar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('type', 'all');
    fixture.componentRef.setInput('customOnly', false);
    component.typeChange.subscribe(value => selected.push(value));
    component.customOnlyChange.subscribe(value => customToggles.push(value));
    fixture.detectChanges();
  });

  it('offers every gear type plus an all-types option', () => {
    expect(chips().map(chip => chip.textContent?.trim())).toEqual(['All', 'Weapons', 'Armor', 'Loot']);
  });

  it('marks the active filter as checked', () => {
    fixture.componentRef.setInput('type', 'armor');
    fixture.detectChanges();

    expect(chips()[2].getAttribute('aria-checked')).toBe('true');
    expect(chips()[0].getAttribute('aria-checked')).toBe('false');
  });

  it('keeps only the active filter in the tab order', () => {
    fixture.componentRef.setInput('type', 'loot');
    fixture.detectChanges();

    expect(chips().map(chip => chip.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0']);
  });

  it('emits the filter that was clicked', () => {
    chips()[1].click();

    expect(selected).toEqual(['weapon']);
  });

  it('selects as the arrow keys move, per the radiogroup pattern', () => {
    chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(selected).toEqual(['weapon']);
  });

  it('wraps from the first filter back to the last', () => {
    chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    expect(selected).toEqual(['loot']);
  });

  it('selects with the vertical arrows too, since the chips wrap onto two rows', () => {
    chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(selected).toEqual(['weapon', 'loot']);
  });

  it('jumps to the ends with Home and End', () => {
    chips()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    chips()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));

    expect(selected).toEqual(['loot', 'all']);
  });

  it('ignores keys that are not part of the pattern', () => {
    chips()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(selected).toEqual([]);
  });

  it('reports the custom-only switch as a switch, not a fifth type', () => {
    expect(customSwitch().getAttribute('aria-checked')).toBe('false');
    expect(chips()).not.toContain(customSwitch());
  });

  it('toggles the custom-only switch off again', () => {
    customSwitch().click();
    fixture.componentRef.setInput('customOnly', true);
    fixture.detectChanges();
    customSwitch().click();

    expect(customToggles).toEqual([true, false]);
  });
});
