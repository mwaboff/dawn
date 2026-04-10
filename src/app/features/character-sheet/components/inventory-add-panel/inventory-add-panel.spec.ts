import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryAddPanel } from './inventory-add-panel';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';

@Component({
  template: `
    <app-inventory-add-panel
      [itemType]="itemType()"
      [open]="open()" />
  `,
  imports: [InventoryAddPanel],
})
class TestHost {
  itemType = signal<'weapon' | 'armor' | 'loot'>('weapon');
  open = signal(false);
}

describe('InventoryAddPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;
  let mockWeaponService: { getWeaponsRaw: ReturnType<typeof vi.fn> };
  let mockArmorService: { getArmorsRaw: ReturnType<typeof vi.fn> };
  let mockLootService: { getLootRaw: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockWeaponService = { getWeaponsRaw: vi.fn().mockReturnValue(of({ items: [], currentPage: 0, totalPages: 0, totalElements: 0 })) };
    mockArmorService = { getArmorsRaw: vi.fn().mockReturnValue(of({ items: [], currentPage: 0, totalPages: 0, totalElements: 0 })) };
    mockLootService = { getLootRaw: vi.fn().mockReturnValue(of({ items: [], currentPage: 0, totalPages: 0, totalElements: 0 })) };

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        { provide: WeaponService, useValue: mockWeaponService },
        { provide: ArmorService, useValue: mockArmorService },
        { provide: LootService, useValue: mockLootService },
      ],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-inventory-add-panel')).toBeTruthy();
  });

  it('does not render panel content when closed', () => {
    host.open.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel')).toBeNull();
  });

  it('renders panel content when open', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel')).toBeTruthy();
  });

  it('shows weapon title when itemType is weapon', () => {
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__title')?.textContent?.trim()).toBe('Add Weapon');
  });

  it('shows armor title when itemType is armor', () => {
    host.itemType.set('armor');
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__title')?.textContent?.trim()).toBe('Add Armor');
  });

  it('shows loot title when itemType is loot', () => {
    host.itemType.set('loot');
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__title')?.textContent?.trim()).toBe('Add Loot');
  });

  it('shows load button when open and no items loaded', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__load-btn')).toBeTruthy();
  });

  it('calls weaponService when load button clicked for weapon type', () => {
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();

    expect(mockWeaponService.getWeaponsRaw).toHaveBeenCalledWith({ size: 50 });
  });

  it('calls armorService when load button clicked for armor type', () => {
    host.itemType.set('armor');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();

    expect(mockArmorService.getArmorsRaw).toHaveBeenCalledWith({ size: 50 });
  });

  it('calls lootService when load button clicked for loot type', () => {
    host.itemType.set('loot');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();

    expect(mockLootService.getLootRaw).toHaveBeenCalledWith({});
  });

  it('shows error state when weapon load fails', () => {
    mockWeaponService.getWeaponsRaw.mockReturnValue(throwError(() => new Error('fail')));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__error')).toBeTruthy();
  });

  it('shows retry button when load fails', () => {
    mockWeaponService.getWeaponsRaw.mockReturnValue(throwError(() => new Error('fail')));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__retry')).toBeTruthy();
  });

  it('shows weapon items after successful load', () => {
    const weapons = [{ id: 1, name: 'Dagger', trait: 'Finesse', range: 'Melee', burden: 'Light', features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__item-name')?.textContent?.trim()).toBe('Dagger');
  });

  it('closes panel when close button clicked', () => {
    const closedSpy = vi.fn();
    host.open.set(true);
    fixture.detectChanges();

    const panel = fixture.debugElement.children[0].componentInstance as InventoryAddPanel;
    panel.closed.subscribe(closedSpy);

    el.querySelector<HTMLButtonElement>('.add-panel__close')!.click();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('renders weapon tier badge in a dedicated tier column', () => {
    const weapons = [{ id: 1, name: 'Sword', tier: 2, damage: { notation: '1d8' }, range: 'Melee', features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__item-tier')?.textContent?.trim()).toBe('T2');
  });

  it('renders armor tier badge', () => {
    const armors = [{ id: 1, name: 'Plate', tier: 3, baseScore: 5, features: [] }];
    mockArmorService.getArmorsRaw.mockReturnValue(of({ items: armors, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('armor');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__item-tier')?.textContent?.trim()).toBe('T3');
  });

  it('does not render a tier cell for loot rows', () => {
    const loots = [{ id: 1, name: 'Potion', isConsumable: true, costTags: [] }];
    mockLootService.getLootRaw.mockReturnValue(of({ items: loots, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('loot');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__item-tier')).toBeNull();
  });

  it('uses grid layout classes on item buttons', () => {
    const weapons = [{ id: 1, name: 'Dagger', features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    const btn = el.querySelector('.add-panel__item-btn');
    expect(btn).toBeTruthy();
    expect(btn?.querySelector('.add-panel__item-name')).toBeTruthy();
    expect(btn?.querySelector('.add-panel__item-tier')).toBeTruthy();
    expect(btn?.querySelector('.add-panel__item-stat--center')).toBeTruthy();
    expect(btn?.querySelector('.add-panel__item-stat--end')).toBeTruthy();
  });

  it('renders P badge for primary weapon', () => {
    const weapons = [{ id: 1, name: 'Sword', isPrimary: true, features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    const badge = el.querySelector('.add-panel__slot-badge');
    expect(badge?.textContent?.trim()).toBe('P');
  });

  it('renders S badge for secondary weapon', () => {
    const weapons = [{ id: 1, name: 'Dagger', isPrimary: false, features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    const badge = el.querySelector('.add-panel__slot-badge');
    expect(badge?.textContent?.trim()).toBe('S');
  });

  it('does not render a slot badge when isPrimary is undefined', () => {
    const weapons = [{ id: 1, name: 'Staff', features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__slot-badge')).toBeNull();
  });

  it('clears loaded weapons and shows browse button when itemType switches', () => {
    const weapons = [{ id: 1, name: 'Dagger', features: [] }];
    mockWeaponService.getWeaponsRaw.mockReturnValue(of({ items: weapons, currentPage: 0, totalPages: 1, totalElements: 1 }));
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.add-panel__load-btn')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__item-name')?.textContent?.trim()).toBe('Dagger');

    host.itemType.set('armor');
    fixture.detectChanges();

    expect(el.querySelector('.add-panel__item-name')).toBeNull();
    expect(el.querySelector('.add-panel__load-btn')?.textContent?.trim()).toBe('Browse Armor');
  });
});
