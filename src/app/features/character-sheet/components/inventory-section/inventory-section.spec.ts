import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { InventorySection } from './inventory-section';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../models/character-sheet-view.model';

@Component({
  template: `<app-inventory-section [weapons]="weapons()" [armors]="armors()" [items]="items()" />`,
  imports: [InventorySection],
})
class TestHost {
  weapons = signal<WeaponDisplay[]>([
    { id: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', features: [] },
  ]);
  armors = signal<ArmorDisplay[]>([]);
  items = signal<LootDisplay[]>([]);
}

describe('InventorySection', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-inventory-section')).toBeTruthy();
  });

  it('renders the inventory title', () => {
    expect(el.querySelector('.inventory-section__title')?.textContent?.trim()).toBe('Inventory');
  });

  it('renders three tab buttons', () => {
    expect(el.querySelectorAll('.inventory-tab').length).toBe(3);
  });

  it('defaults to weapons tab active', () => {
    expect(el.querySelector('.inventory-tab--active')?.textContent).toContain('Weapons');
  });

  it('displays weapon count badge', () => {
    const countBadge = el.querySelector('.inventory-tab--active .inventory-tab__count');
    expect(countBadge?.textContent?.trim()).toBe('1');
  });

  it('renders weapon items in the weapons panel', () => {
    expect(el.querySelector('.inventory-item__name')?.textContent?.trim()).toBe('Dagger');
  });

  it('switches to armor tab on click', () => {
    const armorTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[1];
    armorTab.click();
    fixture.detectChanges();

    expect(el.querySelector('.inventory-tab--active')?.textContent).toContain('Armor');
  });

  it('shows empty state for armor tab with no armors', () => {
    const armorTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[1];
    armorTab.click();
    fixture.detectChanges();

    expect(el.querySelector('.empty-state')?.textContent).toContain('No armor in inventory.');
  });

  it('displays armor items when present', () => {
    host.armors.set([{ id: 1, name: 'Chain Mail', baseScore: 4, features: [] }]);
    fixture.detectChanges();
    const armorTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[1];
    armorTab.click();
    fixture.detectChanges();

    expect(el.querySelector('.inventory-item__name')?.textContent?.trim()).toBe('Chain Mail');
  });

  it('switches to loot tab on click', () => {
    const lootTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[2];
    lootTab.click();
    fixture.detectChanges();

    expect(el.querySelector('.inventory-tab--active')?.textContent).toContain('Loot');
  });

  it('shows empty state for loot tab with no items', () => {
    const lootTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[2];
    lootTab.click();
    fixture.detectChanges();

    expect(el.querySelector('.empty-state')?.textContent).toContain('No loot in inventory.');
  });
});
