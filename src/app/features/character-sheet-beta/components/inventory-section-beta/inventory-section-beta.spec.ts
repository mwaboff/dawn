import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { InventorySectionBeta } from './inventory-section-beta';
import { ArmorDisplay, LootDisplay, WeaponDisplay } from '../../../character-sheet/models/character-sheet-view.model';
import { InventoryEditEvent, InventoryEquipArmorEvent, InventoryEquipWeaponEvent, InventoryRemoveEvent } from '../../../character-sheet/components/inventory-section/inventory-section';
import { WeaponEquipConstraints } from '../../../character-sheet/utils/inventory-equip.utils';

function buildWeapon(overrides: Partial<WeaponDisplay> = {}): WeaponDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Dagger',
    isPrimary: true,
    damage: '1d4',
    trait: 'Finesse',
    range: 'Melee',
    burden: 'ONE_HANDED',
    features: [],
    ...overrides,
  };
}

function buildArmor(overrides: Partial<ArmorDisplay> = {}): ArmorDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Leather Armor',
    baseScore: 3,
    baseMajorThreshold: 2,
    baseSevereThreshold: 4,
    features: [],
    ...overrides,
  };
}

function buildLoot(overrides: Partial<LootDisplay> = {}): LootDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Torch',
    isConsumable: false,
    costTags: [],
    ...overrides,
  };
}

@Component({
  template: `
    <app-inventory-section-beta
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
      [currentUserId]="currentUserId()"
      (removeItem)="onRemoveItem($event)"
      (editItem)="onEditItem($event)"
      (equipWeapon)="onEquipWeapon($event)"
      (unequipWeapon)="onUnequipWeapon($event)"
      (equipArmor)="onEquipArmor($event)"
      (unequipArmor)="onUnequipArmor()" />
  `,
  imports: [InventorySectionBeta],
})
class TestHost {
  weapons = signal<WeaponDisplay[]>([buildWeapon()]);
  armors = signal<ArmorDisplay[]>([]);
  items = signal<LootDisplay[]>([]);
  isOwner = signal(false);
  activePrimaryWeapon = signal<WeaponDisplay | null>(null);
  activeSecondaryWeapon = signal<WeaponDisplay | null>(null);
  activeArmor = signal<ArmorDisplay | null>(null);
  weaponConstraints = signal<WeaponEquipConstraints | null>({
    primarySlotOccupied: false,
    secondarySlotOccupied: false,
    twoHandedEquipped: false,
  });
  canEquipArmorSlot = signal(true);
  errorMessage = signal<string | null>(null);
  currentUserId = signal<number | null>(null);

  removeEvents: InventoryRemoveEvent[] = [];
  editEvents: InventoryEditEvent[] = [];
  equipWeaponEvents: InventoryEquipWeaponEvent[] = [];
  unequipWeaponEvents: { slot: 'primary' | 'secondary' }[] = [];
  equipArmorEvents: InventoryEquipArmorEvent[] = [];
  unequipArmorCount = 0;

  onRemoveItem(ev: InventoryRemoveEvent): void {
    this.removeEvents.push(ev);
  }

  onEditItem(ev: InventoryEditEvent): void {
    this.editEvents.push(ev);
  }

  onEquipWeapon(ev: InventoryEquipWeaponEvent): void {
    this.equipWeaponEvents.push(ev);
  }

  onUnequipWeapon(ev: { slot: 'primary' | 'secondary' }): void {
    this.unequipWeaponEvents.push(ev);
  }

  onEquipArmor(ev: InventoryEquipArmorEvent): void {
    this.equipArmorEvents.push(ev);
  }

  onUnequipArmor(): void {
    this.unequipArmorCount++;
  }
}

describe('InventorySectionBeta', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  function tabButtons(): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  }

  function entityCards(): HTMLElement[] {
    return Array.from(el.querySelectorAll('app-entity-card'));
  }

  it('renders one app-entity-card per item on the active (weapons) tab', () => {
    host.weapons.set([buildWeapon({ inventoryEntryId: 1, name: 'Dagger' }), buildWeapon({ inventoryEntryId: 2, name: 'Sword' })]);
    fixture.detectChanges();

    expect(entityCards().length).toBe(2);
  });

  it('renders loot on the loot tab with no equip actions, since loot is never equipped', () => {
    host.items.set([buildLoot({ name: 'Torch' })]);
    host.isOwner.set(true);
    fixture.detectChanges();

    tabButtons()[2].click();
    fixture.detectChanges();

    expect(entityCards().length).toBe(1);
    expect(el.querySelector('[card-actions]')).toBeNull();
  });

  it('swaps the rendered list when a different tab is selected', () => {
    host.armors.set([buildArmor({ name: 'Chain Mail' })]);
    fixture.detectChanges();

    tabButtons()[1].click();
    fixture.detectChanges();

    expect(entityCards().length).toBe(1);
    expect(el.textContent).toContain('Chain Mail');
    expect(el.textContent).not.toContain('Dagger');
  });

  describe('remove confirmation', () => {
    function openRemoveConfirm(): void {
      host.isOwner.set(true);
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--vault')!.click();
      fixture.detectChanges();
    }

    it('clears a pending remove confirmation when the tab is switched', () => {
      openRemoveConfirm();
      expect(el.querySelector('.inline-confirm')).toBeTruthy();

      tabButtons()[1].click();
      fixture.detectChanges();

      expect(el.querySelector('.inline-confirm')).toBeNull();
    });

    it('marks the Remove button aria-disabled and shows the reason when the item is equipped', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--vault')!;
      expect(removeBtn.getAttribute('aria-disabled')).toBe('true');
      expect(el.querySelector('.card-swap-hint')?.textContent?.trim()).toBe('Unequip to remove');
    });

    it('keeps a blocked Remove button focusable rather than natively disabled, and describes the reason', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--vault')!;
      const hint = el.querySelector<HTMLElement>('.card-swap-hint')!;

      expect(removeBtn.disabled).toBe(false);
      expect(removeBtn.getAttribute('aria-describedby')).toBe(hint.id);
    });

    it('does not open the confirm when a blocked Remove button is clicked', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--vault')!.click();
      fixture.detectChanges();

      expect(el.querySelector('.inline-confirm')).toBeNull();
    });

    it('returns focus to the Remove button when the confirm is cancelled', async () => {
      host.weapons.set([buildWeapon({ inventoryEntryId: 1 })]);
      openRemoveConfirm();

      el.querySelector<HTMLButtonElement>('.inline-confirm__btn--cancel')!.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const removeBtn = el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--vault')!;
      expect(document.activeElement).toBe(removeBtn);
    });

    it('emits removeItem with the inventory entry id and type once confirmed', () => {
      host.weapons.set([buildWeapon({ inventoryEntryId: 7 })]);
      openRemoveConfirm();

      el.querySelector<HTMLButtonElement>('.inline-confirm__btn--confirm')!.click();

      expect(host.removeEvents).toEqual([{ type: 'weapon', inventoryEntryId: 7 }]);
    });
  });

  describe('Edit button visibility', () => {
    it('shows the Edit button for the owner viewing their own homebrew', () => {
      host.weapons.set([buildWeapon({ createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('[card-controls] .card-swap-btn:not(.card-swap-btn--vault)')).toBeTruthy();
    });

    it('shows the Edit button for a NON-owner viewer who authored the item, but hides owner-only controls', () => {
      host.weapons.set([buildWeapon({ createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(false);
      fixture.detectChanges();

      expect(el.querySelector('[card-controls] .card-swap-btn:not(.card-swap-btn--vault)')).toBeTruthy();
      expect(el.querySelector('[card-controls] .card-swap-btn--vault')).toBeNull();
    });

    it('hides the Edit button for official gear with no author', () => {
      host.weapons.set([buildWeapon({ createdByUserId: null })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('[card-controls] .card-swap-btn:not(.card-swap-btn--vault)')).toBeNull();
    });

    it('emits editItem with the catalogue item id when Edit is clicked', () => {
      host.weapons.set([buildWeapon({ id: 42, inventoryEntryId: 1, createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn:not(.card-swap-btn--vault)')!.click();

      expect(host.editEvents).toEqual([{ type: 'weapon', itemId: 42 }]);
    });
  });

  describe('equip / unequip clicks', () => {
    it('emits equipWeapon with the primary slot for a stowed primary weapon', () => {
      host.weapons.set([buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: true })]);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-actions] .card-swap-btn--equip')!.click();

      expect(host.equipWeaponEvents).toEqual([{ weaponId: 3, inventoryEntryId: 9, slot: 'primary' }]);
    });

    it('emits equipWeapon with the secondary slot for a stowed secondary weapon', () => {
      host.weapons.set([buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: false })]);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-actions] .card-swap-btn--equip')!.click();

      expect(host.equipWeaponEvents).toEqual([{ weaponId: 3, inventoryEntryId: 9, slot: 'secondary' }]);
    });

    it('emits unequipWeapon naming the slot the weapon actually occupies (secondary)', () => {
      const equipped = buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: false });
      host.weapons.set([equipped]);
      host.activeSecondaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-actions] .card-swap-btn--vault')!.click();

      expect(host.unequipWeaponEvents).toEqual([{ slot: 'secondary' }]);
    });

    it('emits equipArmor when a stowed armor is equipped', () => {
      host.armors.set([buildArmor({ id: 4, inventoryEntryId: 11 })]);
      host.isOwner.set(true);
      fixture.detectChanges();
      tabButtons()[1].click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-actions] .card-swap-btn--equip')!.click();

      expect(host.equipArmorEvents).toEqual([{ armorId: 4, inventoryEntryId: 11 }]);
    });

    it('emits unequipArmor when equipped armor is unequipped', () => {
      const equipped = buildArmor({ id: 4, inventoryEntryId: 11 });
      host.armors.set([equipped]);
      host.activeArmor.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();
      tabButtons()[1].click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-actions] .card-swap-btn--vault')!.click();

      expect(host.unequipArmorCount).toBe(1);
    });
  });

  describe('empty state per tab', () => {
    it('renders the weapons empty state when there are no weapons', () => {
      host.weapons.set([]);
      fixture.detectChanges();

      expect(el.querySelector('.empty-state')?.textContent).toContain('No weapons in inventory.');
    });

    it('renders the armor empty state when there is no armor', () => {
      fixture.detectChanges();
      tabButtons()[1].click();
      fixture.detectChanges();

      expect(el.querySelector('.empty-state')?.textContent).toContain('No armor in inventory.');
    });

    it('renders the loot empty state when there is no loot', () => {
      fixture.detectChanges();
      tabButtons()[2].click();
      fixture.detectChanges();

      expect(el.querySelector('.empty-state')?.textContent).toContain('No loot in inventory.');
    });
  });
});
