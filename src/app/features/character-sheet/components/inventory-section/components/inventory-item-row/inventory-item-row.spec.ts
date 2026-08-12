import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryItemRow } from './inventory-item-row';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../../../models/character-sheet-view.model';

const weapon: WeaponDisplay = {
  id: 1,
  inventoryEntryId: 1,
  name: 'Dagger',
  damage: '1d4+2',
  trait: 'Finesse',
  range: 'Melee',
  burden: 'ONE_HANDED',
  isPrimary: true,
  features: [],
};

const armor: ArmorDisplay = {
  id: 2,
  inventoryEntryId: 2,
  name: 'Chainmail',
  baseScore: 5,
  baseMajorThreshold: 0,
  baseSevereThreshold: 0,
  features: [],
};

const loot: LootDisplay = {
  id: 3,
  inventoryEntryId: 3,
  name: 'Health Potion',
  isConsumable: true,
  costTags: ['2g'],
};

@Component({
  template: `
    <app-inventory-item-row
      [item]="item()"
      [itemType]="itemType()"
      [isOwner]="isOwner()"
      [equipState]="equipState()"
      [confirming]="confirming()"
      [canEquipAsPrimary]="canEquipAsPrimary()"
      [canEquipAsSecondary]="canEquipAsSecondary()"
      [canEquipArmor]="canEquipArmor()"
      [currentUserId]="currentUserId()"
      (editClicked)="onEditClicked()"
      (removeClicked)="onRemoveClicked()"
      (removeConfirmed)="onRemoveConfirmed()"
      (removeCancelled)="onRemoveCancelled()"
      (equipClicked)="onEquipClicked($event)"
      (unequipClicked)="onUnequipClicked()" />
  `,
  imports: [InventoryItemRow],
})
class TestHost {
  item = signal<WeaponDisplay | ArmorDisplay | LootDisplay>(weapon);
  itemType = signal<'weapon' | 'armor' | 'loot'>('weapon');
  isOwner = signal(true);
  equipState = signal<string | boolean | null>(null);
  confirming = signal(false);
  canEquipAsPrimary = signal(true);
  canEquipAsSecondary = signal(true);
  canEquipArmor = signal(true);
  currentUserId = signal<number | null>(null);

  onEditClicked = vi.fn();
  onRemoveClicked = vi.fn();
  onRemoveConfirmed = vi.fn();
  onRemoveCancelled = vi.fn();
  onEquipClicked = vi.fn();
  onUnequipClicked = vi.fn();
}

describe('InventoryItemRow', () => {
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

  describe('edit affordance', () => {
    it('is hidden on official gear, which has no author', () => {
      host.currentUserId.set(42);
      host.item.set({ ...weapon, createdByUserId: null });
      fixture.detectChanges();

      expect(el.querySelector('.edit-btn')).toBeFalsy();
    });

    it('is hidden on homebrew someone else wrote', () => {
      host.currentUserId.set(42);
      host.item.set({ ...weapon, createdByUserId: 99 });
      fixture.detectChanges();

      expect(el.querySelector('.edit-btn')).toBeFalsy();
    });

    it('is shown on homebrew the viewer wrote', () => {
      host.currentUserId.set(42);
      host.item.set({ ...weapon, createdByUserId: 42 });
      fixture.detectChanges();

      expect(el.querySelector('.edit-btn')).toBeTruthy();
    });

    it('is hidden when signed out, even though the item has an author', () => {
      host.currentUserId.set(null);
      host.item.set({ ...weapon, createdByUserId: 42 });
      fixture.detectChanges();

      expect(el.querySelector('.edit-btn')).toBeFalsy();
    });

    it('is shown on the viewer\'s own gear even when it is equipped and cannot be removed', () => {
      host.currentUserId.set(42);
      host.item.set({ ...weapon, createdByUserId: 42 });
      host.equipState.set('primary');
      fixture.detectChanges();

      expect(el.querySelector('.remove-btn')).toBeFalsy();
      expect(el.querySelector('.edit-btn')).toBeTruthy();
    });

    it('emits editClicked when pressed', () => {
      host.currentUserId.set(42);
      host.item.set({ ...weapon, createdByUserId: 42 });
      fixture.detectChanges();

      (el.querySelector('.edit-btn') as HTMLButtonElement).click();

      expect(host.onEditClicked).toHaveBeenCalled();
    });
  });

  describe('weapon rendering', () => {
    it('renders weapon name', () => {
      expect(el.querySelector('.equipment-card__name')?.textContent?.trim()).toBe('Dagger');
    });

    it('renders weapon damage stat', () => {
      const stats = el.querySelectorAll('.equip-stat');
      const texts = Array.from(stats).map(s => s.textContent?.trim());
      expect(texts).toContain('1d4+2');
    });

    it('renders weapon range stat', () => {
      const stats = el.querySelectorAll('.equip-stat');
      const texts = Array.from(stats).map(s => s.textContent?.trim());
      expect(texts).toContain('Melee');
    });

    it('renders one-handed burden icon for ONE_HANDED weapon', () => {
      const burdenEl = el.querySelector('.equip-stat--burden');
      expect(burdenEl).toBeTruthy();
      expect(burdenEl?.getAttribute('title')).toBe('One-Handed');
      expect(burdenEl?.querySelectorAll('.burden-hand').length).toBe(1);
    });

    it('renders two-handed burden icons for TWO_HANDED weapon', () => {
      host.item.set({ ...weapon, burden: 'TWO_HANDED' });
      fixture.detectChanges();

      const burdenEl = el.querySelector('.equip-stat--burden');
      expect(burdenEl).toBeTruthy();
      expect(burdenEl?.getAttribute('title')).toBe('Two-Handed');
      expect(burdenEl?.querySelectorAll('.burden-hand').length).toBe(2);
    });

    it('does not render burden icon for unknown burden value', () => {
      host.item.set({ ...weapon, burden: '' });
      fixture.detectChanges();

      expect(el.querySelector('.equip-stat--burden')).toBeNull();
    });

    it('does not include burden in cardStats text', () => {
      const stats = el.querySelectorAll('.equip-stat:not(.equip-stat--burden)');
      const texts = Array.from(stats).map(s => s.textContent?.trim());
      expect(texts).not.toContain('ONE_HANDED');
    });
  });

  describe('armor rendering', () => {
    beforeEach(() => {
      host.item.set(armor);
      host.itemType.set('armor');
      fixture.detectChanges();
    });

    it('renders armor name', () => {
      expect(el.querySelector('.equipment-card__name')?.textContent?.trim()).toBe('Chainmail');
    });

    it('renders armor base score stat', () => {
      const stats = el.querySelectorAll('.equip-stat');
      const texts = Array.from(stats).map(s => s.textContent?.trim());
      expect(texts.some(t => t?.includes('5'))).toBe(true);
    });
  });

  describe('loot rendering', () => {
    beforeEach(() => {
      host.item.set(loot);
      host.itemType.set('loot');
      fixture.detectChanges();
    });

    it('renders loot name', () => {
      expect(el.querySelector('.equipment-card__name')?.textContent?.trim()).toBe('Health Potion');
    });

    it('renders consumable badge for consumable loot', () => {
      expect(el.querySelector('.equipment-card__badge')).toBeTruthy();
    });

    it('renders cost tags', () => {
      const stats = el.querySelectorAll('.equip-stat');
      const texts = Array.from(stats).map(s => s.textContent?.trim());
      expect(texts).toContain('2g');
    });
  });

  describe('owner controls', () => {
    it('shows remove button for owner', () => {
      host.isOwner.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.remove-btn')).toBeTruthy();
    });

    it('does not show remove button for non-owner', () => {
      host.isOwner.set(false);
      fixture.detectChanges();
      expect(el.querySelector('.remove-btn')).toBeNull();
    });

    it('emits removeClicked when remove button clicked', () => {
      host.isOwner.set(true);
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.remove-btn')!.click();
      expect(host.onRemoveClicked).toHaveBeenCalled();
    });
  });

  describe('confirm state', () => {
    it('shows confirm message when confirming is true', () => {
      host.confirming.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.confirm-message')?.textContent).toContain('Remove Dagger?');
    });

    it('shows yes and cancel buttons when confirming', () => {
      host.confirming.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.confirm-btn--yes')).toBeTruthy();
      expect(el.querySelector('.confirm-btn--cancel')).toBeTruthy();
    });

    it('emits removeConfirmed when yes button clicked', () => {
      host.confirming.set(true);
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.confirm-btn--yes')!.click();
      expect(host.onRemoveConfirmed).toHaveBeenCalled();
    });

    it('emits removeCancelled when cancel button clicked', () => {
      host.confirming.set(true);
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.confirm-btn--cancel')!.click();
      expect(host.onRemoveCancelled).toHaveBeenCalled();
    });
  });

  describe('weapon equip controls', () => {
    it('shows equip primary and secondary buttons when unequipped', () => {
      host.isOwner.set(true);
      host.equipState.set(null);
      fixture.detectChanges();

      const equipBtns = el.querySelectorAll('.card-swap-btn--equip');
      expect(equipBtns.length).toBe(2);
    });

    it('shows unequip button when weapon is equipped as primary', () => {
      host.isOwner.set(true);
      host.equipState.set('primary');
      fixture.detectChanges();

      expect(el.querySelector('.card-swap-btn--vault')).toBeTruthy();
      expect(el.querySelectorAll('.card-swap-btn--equip').length).toBe(0);
    });

    it('shows equipped badge when weapon is primary', () => {
      host.equipState.set('primary');
      fixture.detectChanges();

      const badge = el.querySelector('.equipment-card__badge');
      expect(badge?.textContent?.trim()).toBe('Primary');
    });

    it('shows equipped badge when weapon is secondary', () => {
      host.equipState.set('secondary');
      fixture.detectChanges();

      const badge = el.querySelector('.equipment-card__badge');
      expect(badge?.textContent?.trim()).toBe('Secondary');
    });

    it('emits equipClicked with primary when equip primary clicked', () => {
      host.isOwner.set(true);
      host.equipState.set(null);
      fixture.detectChanges();

      const btns = el.querySelectorAll<HTMLButtonElement>('.card-swap-btn--equip');
      btns[0].click();
      expect(host.onEquipClicked).toHaveBeenCalledWith('primary');
    });

    it('emits equipClicked with secondary when equip secondary clicked', () => {
      host.isOwner.set(true);
      host.equipState.set(null);
      fixture.detectChanges();

      const btns = el.querySelectorAll<HTMLButtonElement>('.card-swap-btn--equip');
      btns[1].click();
      expect(host.onEquipClicked).toHaveBeenCalledWith('secondary');
    });

    it('emits unequipClicked when unequip button clicked', () => {
      host.isOwner.set(true);
      host.equipState.set('primary');
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.card-swap-btn--vault')!.click();
      expect(host.onUnequipClicked).toHaveBeenCalled();
    });
  });

  describe('armor equip controls', () => {
    beforeEach(() => {
      host.item.set(armor);
      host.itemType.set('armor');
      host.isOwner.set(true);
      host.equipState.set(false);
      fixture.detectChanges();
    });

    it('shows equip button when armor is not equipped', () => {
      expect(el.querySelector('.card-swap-btn--equip')).toBeTruthy();
    });

    it('shows unequip button when armor is equipped', () => {
      host.equipState.set(true);
      fixture.detectChanges();

      expect(el.querySelector('.card-swap-btn--vault')).toBeTruthy();
      expect(el.querySelector('.card-swap-btn--equip')).toBeNull();
    });

    it('shows equipped badge when armor is equipped', () => {
      host.equipState.set(true);
      fixture.detectChanges();

      expect(el.querySelector('.equipment-card__badge')?.textContent?.trim()).toBe('Equipped');
    });

    it('emits equipClicked when equip clicked', () => {
      el.querySelector<HTMLButtonElement>('.card-swap-btn--equip')!.click();
      expect(host.onEquipClicked).toHaveBeenCalledWith('equip');
    });

    it('emits unequipClicked when unequip clicked', () => {
      host.equipState.set(true);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.card-swap-btn--vault')!.click();
      expect(host.onUnequipClicked).toHaveBeenCalled();
    });
  });

  describe('loot equip controls', () => {
    beforeEach(() => {
      host.item.set(loot);
      host.itemType.set('loot');
      host.isOwner.set(true);
      fixture.detectChanges();
    });

    it('does not show equip/unequip buttons for loot', () => {
      expect(el.querySelector('.card-swap-btn')).toBeNull();
    });
  });

  describe('tier display', () => {
    it('renders weapon tier as a header badge when present', () => {
      host.item.set({ ...weapon, tier: 2 });
      host.itemType.set('weapon');
      fixture.detectChanges();

      const badge = el.querySelector('.equipment-card__sub-badge');
      expect(badge?.textContent?.trim()).toBe('T2');
    });

    it('does not render a tier badge when tier is missing', () => {
      host.item.set({ ...weapon });
      host.itemType.set('weapon');
      fixture.detectChanges();

      expect(el.querySelector('.equipment-card__sub-badge')).toBeNull();
    });

    it('does not render tier inside the stats row for weapons', () => {
      host.item.set({ ...weapon, tier: 2 });
      host.itemType.set('weapon');
      fixture.detectChanges();

      const stats = Array.from(el.querySelectorAll('.equip-stat')).map(s => s.textContent?.trim());
      expect(stats.some(t => t?.startsWith('T'))).toBe(false);
    });

    it('renders armor tier as a header badge when present', () => {
      host.item.set({ ...armor, tier: 3 });
      host.itemType.set('armor');
      fixture.detectChanges();

      const badge = el.querySelector('.equipment-card__sub-badge');
      expect(badge?.textContent?.trim()).toBe('T3');
    });
  });

  describe('remove guard when equipped', () => {
    it('shows the remove button for an unequipped weapon', () => {
      host.itemType.set('weapon');
      host.equipState.set(null);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeTruthy();
    });

    it('hides the remove button entirely for an equipped primary weapon', () => {
      host.itemType.set('weapon');
      host.equipState.set('primary');
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeNull();
    });

    it('hides the remove button for equipped armor', () => {
      host.item.set(armor);
      host.itemType.set('armor');
      host.equipState.set(true);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeNull();
    });

    it('shows the remove button for unequipped armor', () => {
      host.item.set(armor);
      host.itemType.set('armor');
      host.equipState.set(false);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeTruthy();
    });

    it('shows the remove button for loot regardless of equip state', () => {
      host.item.set(loot);
      host.itemType.set('loot');
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeTruthy();
    });
  });

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    it('renders the placeholder instead of EquipmentCard for a restricted weapon', () => {
      host.item.set({ ...weapon, restricted: true, expansionName: 'Hope & Fear' });
      fixture.detectChanges();

      expect(el.querySelector('app-restricted-card-placeholder')).toBeTruthy();
      expect(el.querySelector('app-equipment-card')).toBeFalsy();
    });

    it('renders the placeholder instead of EquipmentCard for a restricted armor', () => {
      host.item.set({ ...armor, restricted: true, expansionName: 'Hope & Fear' });
      host.itemType.set('armor');
      fixture.detectChanges();

      expect(el.querySelector('app-restricted-card-placeholder')).toBeTruthy();
      expect(el.querySelector('app-equipment-card')).toBeFalsy();
    });

    it('offers no equip-primary/equip-secondary buttons for a restricted, unequipped weapon', () => {
      host.item.set({ ...weapon, restricted: true });
      host.equipState.set(null);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelectorAll('.card-swap-btn--equip').length).toBe(0);
    });

    it('still offers Unequip for a restricted weapon that is equipped -- the removal exception', () => {
      host.item.set({ ...weapon, restricted: true });
      host.equipState.set('primary');
      host.isOwner.set(true);
      fixture.detectChanges();

      const unequipBtn = el.querySelector<HTMLButtonElement>('.card-swap-btn--vault');
      expect(unequipBtn).toBeTruthy();
      expect(unequipBtn?.textContent).toContain('Unequip');

      unequipBtn?.click();
      expect(host.onUnequipClicked).toHaveBeenCalled();
    });

    it('offers no Equip button for a restricted, unequipped armor', () => {
      host.item.set({ ...armor, restricted: true });
      host.itemType.set('armor');
      host.equipState.set(false);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('.card-swap-btn--equip')).toBeFalsy();
    });

    it('still offers Unequip for a restricted armor that is equipped -- the removal exception', () => {
      host.item.set({ ...armor, restricted: true });
      host.itemType.set('armor');
      host.equipState.set(true);
      host.isOwner.set(true);
      fixture.detectChanges();

      const unequipBtn = el.querySelector<HTMLButtonElement>('.card-swap-btn--vault');
      expect(unequipBtn).toBeTruthy();

      unequipBtn?.click();
      expect(host.onUnequipClicked).toHaveBeenCalled();
    });

    it('still offers Remove for a restricted, unequipped weapon', () => {
      host.item.set({ ...weapon, restricted: true });
      host.equipState.set(null);
      host.isOwner.set(true);
      fixture.detectChanges();

      expect(el.querySelector('button.remove-btn')).toBeTruthy();
    });

    it('hides the Edit affordance for a restricted item -- a redacted stub carries no author, so canEditItem never matches', () => {
      host.currentUserId.set(42);
      // No `createdByUserId` -- a real restricted response never sends one (see
      // `buildRestrictedWeaponDisplay`), so this is the shape the row actually receives.
      host.item.set({ ...weapon, restricted: true });
      fixture.detectChanges();

      expect(el.querySelector('.edit-btn')).toBeFalsy();
    });
  });
});
