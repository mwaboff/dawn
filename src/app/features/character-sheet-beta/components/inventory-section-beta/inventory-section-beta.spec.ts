import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventorySectionBeta } from './inventory-section-beta';
import { ArmorDisplay, LootDisplay, WeaponDisplay } from '../../../character-sheet/models/character-sheet-view.model';
import { InventoryEditEvent, InventoryEquipArmorEvent, InventoryEquipWeaponEvent, InventoryRemoveEvent } from '../../../character-sheet/components/inventory-section/inventory-section';
import { WeaponEquipConstraints } from '../../../character-sheet/utils/inventory-equip.utils';
import { AuthService } from '../../../../core/services/auth.service';

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
      (addItem)="onAddItem($event)"
      (createItem)="onCreateItem($event)"
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

  addEvents: { type: string; item: unknown }[] = [];
  createEvents: string[] = [];
  removeEvents: InventoryRemoveEvent[] = [];
  editEvents: InventoryEditEvent[] = [];
  equipWeaponEvents: InventoryEquipWeaponEvent[] = [];
  unequipWeaponEvents: { slot: 'primary' | 'secondary' }[] = [];
  equipArmorEvents: InventoryEquipArmorEvent[] = [];
  unequipArmorCount = 0;

  onAddItem(ev: { type: string; item: unknown }): void {
    this.addEvents.push(ev);
  }

  onCreateItem(kind: string): void {
    this.createEvents.push(kind);
  }

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
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
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
    expect(el.querySelector('[card-controls] .card-swap-btn--equip')).toBeNull();
    expect(el.querySelector('[card-controls] > .card-swap-btn--vault')).toBeNull();
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
      el.querySelector<HTMLButtonElement>('[card-controls] .card-action-row__manage .roster-delete-btn')!.click();
      fixture.detectChanges();
    }

    it('clears a pending remove confirmation when the tab is switched', () => {
      openRemoveConfirm();
      expect(el.querySelector('.roster-inline-confirm')).toBeTruthy();

      tabButtons()[1].click();
      fixture.detectChanges();

      expect(el.querySelector('.roster-inline-confirm')).toBeNull();
    });

    it('marks the Remove button aria-disabled and shows the reason when the item is equipped', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('[card-controls] .card-action-row__manage .card-swap-btn--vault')!;
      expect(removeBtn.getAttribute('aria-disabled')).toBe('true');
      expect(el.querySelector('.card-action-row__manage .card-swap-hint')?.textContent?.trim()).toBe('Unequip to remove');
    });

    it('keeps a blocked Remove button focusable rather than natively disabled, and describes the reason', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      const removeBtn = el.querySelector<HTMLButtonElement>('[card-controls] .card-action-row__manage .card-swap-btn--vault')!;
      const hint = el.querySelector<HTMLElement>('.card-action-row__manage .card-swap-hint')!;

      expect(removeBtn.disabled).toBe(false);
      expect(removeBtn.getAttribute('aria-describedby')).toBe(hint.id);
    });

    it('does not render a delete-confirm trigger for a blocked item, only the disabled icon', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      host.weapons.set([equipped]);
      host.activePrimaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('[card-controls] .card-action-row__manage .roster-delete-btn')).toBeNull();
    });

    it('returns focus to the Remove button when the confirm is cancelled', async () => {
      host.weapons.set([buildWeapon({ inventoryEntryId: 1 })]);
      openRemoveConfirm();

      el.querySelector<HTMLButtonElement>('.roster-inline-cancel-btn')!.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const removeBtn = el.querySelector<HTMLButtonElement>('[card-controls] .card-action-row__manage .roster-delete-btn')!;
      expect(document.activeElement).toBe(removeBtn);
    });

    it('emits removeItem with the inventory entry id and type once confirmed', () => {
      host.weapons.set([buildWeapon({ inventoryEntryId: 7 })]);
      openRemoveConfirm();

      el.querySelector<HTMLButtonElement>('.roster-inline-confirm-btn')!.click();

      expect(host.removeEvents).toEqual([{ type: 'weapon', inventoryEntryId: 7 }]);
    });
  });

  describe('Edit button visibility', () => {
    // Scoped to `[aria-label^="Edit"]`, not just "the first non-vault .card-swap-btn" -- the
    // customize action's own Copy button also renders in `.card-action-row__manage` and is
    // non-vault, so a bare `:not(.card-swap-btn--vault)` selector would false-positive on it.
    function editButton(): HTMLButtonElement | null {
      return el.querySelector<HTMLButtonElement>('.card-action-row__manage .card-swap-btn[aria-label^="Edit"]');
    }

    it('shows the Edit button for the owner viewing their own homebrew', () => {
      host.weapons.set([buildWeapon({ createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(editButton()).toBeTruthy();
    });

    it('shows the Edit button for a NON-owner viewer who authored the item, but hides owner-only controls', () => {
      host.weapons.set([buildWeapon({ createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(false);
      fixture.detectChanges();

      expect(editButton()).toBeTruthy();
      expect(el.querySelector('.card-action-row__manage .card-swap-btn--vault')).toBeNull();
    });

    it('hides the Edit button for official gear with no author', () => {
      host.weapons.set([buildWeapon({ createdByUserId: null })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(editButton()).toBeNull();
    });

    it('emits editItem with the catalogue item id when Edit is clicked', () => {
      host.weapons.set([buildWeapon({ id: 42, inventoryEntryId: 1, createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      editButton()!.click();

      expect(host.editEvents).toEqual([{ type: 'weapon', itemId: 42 }]);
    });

    it('renders the Edit glyph as an icon-only inline SVG button (no visible text label)', () => {
      host.weapons.set([buildWeapon({ createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      const btn = editButton();
      expect(btn?.classList).toContain('card-swap-btn--icon');
      expect(btn?.textContent?.trim()).toBe('');
      const svg = btn?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('focusable')).toBe('false');
      expect(btn?.getAttribute('title')).toBe(btn?.getAttribute('aria-label'));
    });
  });

  // The copy dispatch and success/failure/in-flight logic itself is `CustomizeItemAction`'s own
  // responsibility and is fully covered by its own spec -- this only checks the section wires it
  // up (right item, inside the manage group, no duplicate Edit affordance).
  describe('customize action', () => {
    function customizeButton(): HTMLButtonElement | undefined {
      return Array.from(el.querySelectorAll<HTMLButtonElement>('.card-action-row__manage app-customize-item-action button'))
        .find(b => b.getAttribute('aria-label')?.startsWith('Customize'));
    }

    it('offers a customize/copy glyph button in the manage group when signed in', () => {
      host.weapons.set([buildWeapon()]);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(customizeButton()).toBeTruthy();
      expect(customizeButton()?.classList).toContain('card-swap-btn--icon');
    });

    it('offers nothing when signed out', () => {
      // A fresh fixture, not the shared one from `beforeEach` -- see the identical comment in
      // inventory-item-row.spec.ts: `CustomizeItemAction.canCustomize` caches its first read of
      // `authService.isLoggedIn()`, which only a real signal (not a plain `vi.fn()`) can invalidate.
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
      const signedOutFixture = TestBed.createComponent(TestHost);
      signedOutFixture.componentInstance.weapons.set([buildWeapon()]);
      signedOutFixture.componentInstance.isOwner.set(true);
      signedOutFixture.detectChanges();

      const signedOutEl: HTMLElement = signedOutFixture.nativeElement;
      const btn = Array.from(signedOutEl.querySelectorAll<HTMLButtonElement>('.card-action-row__manage app-customize-item-action button'))
        .find(b => b.getAttribute('aria-label')?.startsWith('Customize'));
      expect(btn).toBeFalsy();
    });

    it('never shows a second Edit button from within the customize action, even for the viewer\'s own homebrew', () => {
      host.weapons.set([buildWeapon({ createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      const editButtons = Array.from(el.querySelectorAll('button')).filter(
        b => b.getAttribute('aria-label')?.startsWith('Edit'),
      );
      expect(editButtons.length).toBe(1);
    });

    it('names the current item in the customize button\'s accessible label', () => {
      host.weapons.set([buildWeapon({ name: 'Rusty Sabre' })]);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(customizeButton()?.getAttribute('aria-label')).toBe('Customize Rusty Sabre');
    });
  });

  describe('equip / unequip clicks', () => {
    it('emits equipWeapon with the primary slot for a stowed primary weapon', () => {
      host.weapons.set([buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: true })]);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--equip')!.click();

      expect(host.equipWeaponEvents).toEqual([{ weaponId: 3, inventoryEntryId: 9, slot: 'primary' }]);
    });

    it('emits equipWeapon with the secondary slot for a stowed secondary weapon', () => {
      host.weapons.set([buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: false })]);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--equip')!.click();

      expect(host.equipWeaponEvents).toEqual([{ weaponId: 3, inventoryEntryId: 9, slot: 'secondary' }]);
    });

    it('emits unequipWeapon naming the slot the weapon actually occupies (secondary)', () => {
      const equipped = buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: false });
      host.weapons.set([equipped]);
      host.activeSecondaryWeapon.set(equipped);
      host.isOwner.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-controls] > .card-swap-btn--vault')!.click();

      expect(host.unequipWeaponEvents).toEqual([{ slot: 'secondary' }]);
    });

    it('emits equipArmor when a stowed armor is equipped', () => {
      host.armors.set([buildArmor({ id: 4, inventoryEntryId: 11 })]);
      host.isOwner.set(true);
      fixture.detectChanges();
      tabButtons()[1].click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('[card-controls] .card-swap-btn--equip')!.click();

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

      el.querySelector<HTMLButtonElement>('[card-controls] > .card-swap-btn--vault')!.click();

      expect(host.unequipArmorCount).toBe(1);
    });
  });

  describe('single footer', () => {
    it('projects equip and manage buttons into one [card-controls] row, and nothing into [card-actions]', () => {
      host.weapons.set([buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: true, createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      const controlsRows = el.querySelectorAll('[card-controls]');
      expect(controlsRows.length).toBe(1);
      expect(controlsRows[0].querySelector('.card-swap-btn--equip')).toBeTruthy();
      expect(controlsRows[0].querySelector('.card-action-row__manage')).toBeTruthy();
      expect(el.querySelector('[card-actions]')).toBeNull();
    });

    it('keeps the Edit/Remove pair inside .card-action-row__manage', () => {
      host.weapons.set([buildWeapon({ id: 3, inventoryEntryId: 9, isPrimary: true, createdByUserId: 5 })]);
      host.currentUserId.set(5);
      host.isOwner.set(true);
      fixture.detectChanges();

      const manage = el.querySelector('.card-action-row__manage')!;
      expect(manage.querySelector('.card-swap-btn:not(.card-swap-btn--vault)')).toBeTruthy();
      expect(manage.querySelector('.roster-delete-btn')).toBeTruthy();
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

  describe('adding gear', () => {
    function addButton(): HTMLButtonElement | null {
      return el.querySelector('.inventory-beta__add-btn');
    }

    function finder(): HTMLElement | null {
      return el.querySelector('app-item-finder');
    }

    it('offers one add control regardless of which tab is open', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelectorAll('.inventory-beta__add-btn').length).toBe(1);
      expect(addButton()?.textContent).toContain('Add gear');
    });

    it('offers no add control to someone else looking at the sheet', () => {
      expect(addButton()).toBeNull();
    });

    it('opens the finder rather than an inline panel scoped to the active tab', () => {
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(finder()).toBeNull();
      addButton()?.click();
      fixture.detectChanges();

      expect(finder()).not.toBeNull();
    });

    it('passes an add straight through to the sheet', () => {
      const loot = { id: 9, name: 'Rope' };
      const section = fixture.debugElement.children[0].componentInstance as InventorySectionBeta;

      section.onItemAdded({ type: 'loot', item: loot as never });

      expect(host.addEvents).toEqual([{ type: 'loot', item: loot }]);
    });

    it('shows the tab the added item landed on, so the add is visible behind the dialog', () => {
      const section = fixture.debugElement.children[0].componentInstance as InventorySectionBeta;

      section.onItemAdded({ type: 'armor', item: { id: 1, name: 'Gambeson' } as never });

      expect(section.activeTab()).toBe('armor');
    });

    it('maps a weapon add onto the plural tab id', () => {
      const section = fixture.debugElement.children[0].componentInstance as InventorySectionBeta;
      section.selectTab('loot');

      section.onItemAdded({ type: 'weapon', item: { id: 1, name: 'Dagger' } as never });

      expect(section.activeTab()).toBe('weapons');
    });

    it('closes the finder before handing off to the item form, so two dialogs never overlap', () => {
      host.isOwner.set(true);
      fixture.detectChanges();
      addButton()?.click();
      fixture.detectChanges();

      const section = fixture.debugElement.children[0].componentInstance as InventorySectionBeta;
      section.onCreateRequested('weapon');
      fixture.detectChanges();

      expect(finder()).toBeNull();
      expect(host.createEvents).toEqual(['weapon']);
    });
  });
});
