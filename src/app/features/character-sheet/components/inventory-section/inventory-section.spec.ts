import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
      [weaponConstraints]="weaponConstraints()"
      [canEquipArmorSlot]="canEquipArmorSlot()"
      [errorMessage]="errorMessage()"
      (removeItem)="onRemoveItem($event)"
      (createItem)="onCreateItem($event)"
      (dismissError)="onDismissError()" />
  `,
  imports: [InventorySection],
})
class TestHost {
  weapons = signal<WeaponDisplay[]>([
    { id: 1, inventoryEntryId: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', isPrimary: true, features: [] },
  ]);
  armors = signal<ArmorDisplay[]>([]);
  items = signal<LootDisplay[]>([]);
  isOwner = signal(false);
  activePrimaryWeapon = signal<WeaponDisplay | null>(null);
  activeSecondaryWeapon = signal<WeaponDisplay | null>(null);
  activeArmor = signal<ArmorDisplay | null>(null);
  weaponConstraints = signal<{ primarySlotOccupied: boolean; secondarySlotOccupied: boolean; twoHandedEquipped: boolean } | null>({
    primarySlotOccupied: false,
    secondarySlotOccupied: false,
    twoHandedEquipped: false,
  });
  canEquipArmorSlot = signal(true);
  errorMessage = signal<string | null>(null);
  removeEvents: { type: string; inventoryEntryId: number }[] = [];
  createRequests: ('weapon' | 'armor' | 'loot')[] = [];
  dismissCount = 0;

  onRemoveItem(ev: { type: string; inventoryEntryId: number }): void {
    this.removeEvents.push(ev);
  }

  onCreateItem(type: 'weapon' | 'armor' | 'loot'): void {
    this.createRequests.push(type);
  }

  onDismissError(): void {
    this.dismissCount++;
  }
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
    expect(el.querySelector('.equipment-card__name')?.textContent?.trim()).toBe('Dagger');
  });

  describe('keyboard navigation (roving tabindex)', () => {
    it('gives the active tab tabindex 0 and the others -1', () => {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.inventory-tab');
      expect(tabs[0].tabIndex).toBe(0);
      expect(tabs[1].tabIndex).toBe(-1);
      expect(tabs[2].tabIndex).toBe(-1);
    });

    it('moves focus to the next tab on ArrowRight without switching the active tab', () => {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.inventory-tab');
      tabs[0].focus();

      tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(tabs[1]);
      expect(el.querySelector('.inventory-tab--active')?.textContent).toContain('Weapons');
    });

    it('wraps from the last tab to the first on ArrowRight', () => {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.inventory-tab');
      tabs[2].focus();

      tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(tabs[0]);
    });

    it('activates the focused tab on Enter', () => {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.inventory-tab');

      tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(el.querySelector('.inventory-tab--active')?.textContent).toContain('Loot');
    });

    it('activates the focused tab on Space', () => {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.inventory-tab');

      tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();

      expect(el.querySelector('.inventory-tab--active')?.textContent).toContain('Armor');
    });

    it('jumps to the last tab on End', () => {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.inventory-tab');
      tabs[0].focus();

      tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(tabs[2]);
    });
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
    host.armors.set([{ id: 1, inventoryEntryId: 1, name: 'Chain Mail', baseScore: 4, baseMajorThreshold: 0, baseSevereThreshold: 0, features: [] }]);
    fixture.detectChanges();
    const armorTab = el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[1];
    armorTab.click();
    fixture.detectChanges();

    expect(el.querySelector('.equipment-card__name')?.textContent?.trim()).toBe('Chain Mail');
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
        { id: 1, inventoryEntryId: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', isPrimary: true, features: [] },
        { id: 2, inventoryEntryId: 2, name: 'Sword', damage: '1d6', trait: 'Strength', range: 'Melee', burden: 'Heavy', isPrimary: true, features: [] },
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

    it('emits removeItem with inventoryEntryId when confirmed', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.remove-btn')!.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.confirm-btn--yes')!.click();

      expect(host.removeEvents).toEqual([{ type: 'weapon', inventoryEntryId: 1 }]);
    });
  });

  describe('duplicate entries with shared weaponId', () => {
    it('renders two rows when weapons share the same id but have different inventoryEntryIds', () => {
      host.weapons.set([
        { id: 7, inventoryEntryId: 101, name: 'Shortbow', damage: '1d6', trait: 'Finesse', range: 'Ranged', burden: 'Two-handed', isPrimary: true, features: [] },
        { id: 7, inventoryEntryId: 102, name: 'Shortbow', damage: '1d6', trait: 'Finesse', range: 'Ranged', burden: 'Two-handed', isPrimary: true, features: [] },
      ]);
      fixture.detectChanges();

      expect(el.querySelectorAll('app-inventory-item-row').length).toBe(2);
    });

    it('tracks confirming state per inventory entry id so only one confirms', () => {
      host.weapons.set([
        { id: 7, inventoryEntryId: 101, name: 'Shortbow', damage: '1d6', trait: 'Finesse', range: 'Ranged', burden: 'Two-handed', isPrimary: true, features: [] },
        { id: 7, inventoryEntryId: 102, name: 'Shortbow', damage: '1d6', trait: 'Finesse', range: 'Ranged', burden: 'Two-handed', isPrimary: true, features: [] },
      ]);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelectorAll<HTMLButtonElement>('.remove-btn')[0].click();
      fixture.detectChanges();

      expect(el.querySelectorAll('.confirm-message').length).toBe(1);
    });
  });

  describe('isPrimary slot enforcement', () => {
    it('primary weapon cannot be equipped as secondary', () => {
      const component = fixture.debugElement.query(By.directive(InventorySection)).componentInstance as InventorySection;
      const primaryWeapon: WeaponDisplay = { id: 1, inventoryEntryId: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', isPrimary: true, features: [] };

      expect(component.canEquipWeaponAsSecondary(primaryWeapon)).toBe(false);
    });

    it('secondary weapon cannot be equipped as primary', () => {
      const component = fixture.debugElement.query(By.directive(InventorySection)).componentInstance as InventorySection;
      const secondaryWeapon: WeaponDisplay = { id: 2, inventoryEntryId: 2, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', isPrimary: false, features: [] };

      expect(component.canEquipWeaponAsPrimary(secondaryWeapon)).toBe(false);
    });
  });

  describe('error banner', () => {
    it('does not render banner when errorMessage is null', () => {
      host.errorMessage.set(null);
      fixture.detectChanges();
      expect(el.querySelector('.inventory-error')).toBeNull();
    });

    it('renders banner when errorMessage is set', () => {
      host.errorMessage.set('Could not add weapon. Please try again.');
      fixture.detectChanges();
      expect(el.querySelector('.inventory-error__text')?.textContent?.trim()).toBe('Could not add weapon. Please try again.');
    });

    it('emits dismissError when dismiss button clicked', () => {
      host.errorMessage.set('fail');
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.inventory-error__dismiss')!.click();

      expect(host.dismissCount).toBe(1);
    });
  });

  describe('create your own', () => {
    function openAddPanel(): void {
      host.isOwner.set(true);
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.add-btn')!.click();
      fixture.detectChanges();
    }

    it('forwards the panel request with the active tab kind', () => {
      openAddPanel();

      el.querySelector<HTMLButtonElement>('.add-panel__create-btn')!.click();

      expect(host.createRequests).toEqual(['weapon']);
    });

    it('forwards loot when the loot tab is active', () => {
      host.isOwner.set(true);
      fixture.detectChanges();
      el.querySelectorAll<HTMLButtonElement>('.inventory-tab')[2].click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.add-btn')!.click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.add-panel__create-btn')!.click();

      expect(host.createRequests).toEqual(['loot']);
    });

    it('closes the picker behind the modal', () => {
      openAddPanel();

      el.querySelector<HTMLButtonElement>('.add-panel__create-btn')!.click();
      fixture.detectChanges();

      expect(el.querySelector('.add-panel')).toBeNull();
    });
  });

  describe('equipped-item remove guard', () => {
    it('hides the remove button when a weapon is equipped', () => {
      const equipped = { id: 1, inventoryEntryId: 1, name: 'Dagger', damage: '1d4', trait: 'Finesse', range: 'Melee', burden: 'Light', isPrimary: true, features: [] };
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeNull();
    });

    it('shows the remove button for an unequipped weapon', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeTruthy();
    });
  });

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    // The actual locked-face/action-gating rules are `InventoryItemRow`'s own -- this is an
    // integration check that a restricted item passed down through the list still reaches the row
    // as such, not a re-test of the row's rendering (see .agents/rules/testing.md on not
    // duplicating a child's assertions).
    it('passes a restricted weapon through to its row, which renders the locked placeholder', () => {
      host.weapons.set([{ id: 1, inventoryEntryId: 1, name: 'Content Not Available', restricted: true, expansionName: 'Hope & Fear', damage: '', trait: '', range: '', burden: '', isPrimary: true, features: [] }]);
      fixture.detectChanges();

      expect(el.querySelector('app-restricted-card-placeholder')).toBeTruthy();
      expect(el.querySelector('app-equipment-card')).toBeFalsy();
    });
  });
});
