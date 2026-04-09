import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { InventorySection } from './inventory-section';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../models/character-sheet-view.model';

@Component({
  template: `
    <app-inventory-section
      [weapons]="weapons()"
      [armors]="armors()"
      [items]="items()"
      [isOwner]="isOwner()"
      [activePrimaryWeapon]="activePrimaryWeapon()"
      [activeSecondaryWeapon]="activeSecondaryWeapon()"
      [activeArmor]="activeArmor()"
      [canEquipPrimary]="canEquipPrimary()"
      [canEquipSecondary]="canEquipSecondary()"
      [canEquipArmorSlot]="canEquipArmorSlot()" />
  `,
  imports: [InventorySection],
})
class TestHost {
  weapons = signal<WeaponDisplay[]>([
    { id: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', features: [] },
  ]);
  armors = signal<ArmorDisplay[]>([]);
  items = signal<LootDisplay[]>([]);
  isOwner = signal(false);
  activePrimaryWeapon = signal<WeaponDisplay | null>(null);
  activeSecondaryWeapon = signal<WeaponDisplay | null>(null);
  activeArmor = signal<ArmorDisplay | null>(null);
  canEquipPrimary = signal(true);
  canEquipSecondary = signal(true);
  canEquipArmorSlot = signal(true);
}

describe('InventorySection', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
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

  describe('add panel', () => {
    it('does not show add button when not owner', () => {
      host.isOwner.set(false);
      fixture.detectChanges();

      expect(el.querySelector('.add-btn')).toBeNull();
    });

    it('shows add button when owner', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('.add-btn')).toBeTruthy();
    });

    it('toggles add panel open when add button clicked', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      const addBtn = el.querySelector<HTMLButtonElement>('.add-btn')!;
      addBtn.click();
      fixture.detectChanges();

      expect(el.querySelector('app-inventory-add-panel .add-panel')).toBeTruthy();
    });

    it('closes add panel when closed event fires', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      const addBtn = el.querySelector<HTMLButtonElement>('.add-btn')!;
      addBtn.click();
      fixture.detectChanges();

      const closeBtn = el.querySelector<HTMLButtonElement>('.add-panel__close');
      closeBtn?.click();
      fixture.detectChanges();

      expect(el.querySelector('.add-panel')).toBeNull();
    });
  });

  describe('remove confirmation', () => {
    it('shows confirming state when remove clicked', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('.remove-btn');
      removeBtn?.click();
      fixture.detectChanges();

      expect(el.querySelector('.confirm-message')).toBeTruthy();
    });

    it('shows only one confirming state at a time', () => {
      host.weapons.set([
        { id: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', features: [] },
        { id: 2, name: 'Sword', damage: '1d6', trait: 'Strength', range: 'Melee', burden: 'Heavy', features: [] },
      ]);
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtns = el.querySelectorAll<HTMLButtonElement>('.remove-btn');
      removeBtns[0].click();
      fixture.detectChanges();

      removeBtns[1].click();
      fixture.detectChanges();

      expect(el.querySelectorAll('.confirm-message').length).toBe(1);
    });

    it('clears confirming state when cancel clicked', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('.remove-btn');
      removeBtn?.click();
      fixture.detectChanges();

      const cancelBtn = el.querySelector<HTMLButtonElement>('.confirm-btn--cancel');
      cancelBtn?.click();
      fixture.detectChanges();

      expect(el.querySelector('.confirm-message')).toBeNull();
    });

    it('clears confirming state when tab is switched', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('.remove-btn');
      removeBtn?.click();
      fixture.detectChanges();

      expect(el.querySelector('.confirm-message')).toBeTruthy();

      const armorTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[1];
      armorTab.click();
      fixture.detectChanges();

      expect(el.querySelector('.confirm-message')).toBeNull();
    });
  });
});
