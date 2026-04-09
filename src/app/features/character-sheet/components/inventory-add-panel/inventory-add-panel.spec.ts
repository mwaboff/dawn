import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryAddPanel } from './inventory-add-panel';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Broadsword',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    isPrimary: true,
    trait: 'STRENGTH',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: 2, diceType: 'D10', modifier: 0, damageType: 'PHYSICAL', notation: '2d10 phy' },
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildArmor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 1,
    name: 'Leather Armor',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    baseMajorThreshold: 6,
    baseSevereThreshold: 12,
    baseScore: 4,
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildLoot(overrides: Partial<LootApiResponse> = {}): LootApiResponse {
  return {
    id: 1,
    name: 'Health Potion',
    isConsumable: true,
    tier: 1,
    isOfficial: true,
    ...overrides,
  };
}

function buildWeaponPage(items: WeaponResponse[], totalPages = 1) {
  return { items, currentPage: 0, totalPages, totalElements: items.length };
}

function buildArmorPage(items: ArmorResponse[], totalPages = 1) {
  return { items, currentPage: 0, totalPages, totalElements: items.length };
}

function buildLootPage(items: LootApiResponse[], totalPages = 1) {
  return { items, currentPage: 0, totalPages, totalElements: items.length };
}

@Component({
  template: `<app-inventory-add-panel [itemType]="itemType()" [open]="open()" (itemAdded)="onAdded($event)" (closed)="onClosed()" />`,
  imports: [InventoryAddPanel],
})
class TestHost {
  readonly itemType = signal<'weapon' | 'armor' | 'loot'>('weapon');
  readonly open = signal(false);
  addedItem: unknown = null;
  closedCount = 0;
  onAdded(item: unknown) { this.addedItem = item; }
  onClosed() { this.closedCount++; }
}

describe('InventoryAddPanel', () => {
  let weaponService: WeaponService;
  let armorService: ArmorService;
  let lootService: LootService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    weaponService = TestBed.inject(WeaponService);
    armorService = TestBed.inject(ArmorService);
    lootService = TestBed.inject(LootService);
  });

  function createHost(itemType: 'weapon' | 'armor' | 'loot' = 'weapon', open = false) {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.itemType.set(itemType);
    fixture.componentInstance.open.set(open);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return fixture;
  }

  it('panel is hidden when open is false', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', false);
    const panel = fixture.nativeElement.querySelector('.add-panel');
    expect(panel).toBeTruthy();
    expect(panel.classList.contains('add-panel--open')).toBe(false);
  });

  it('panel is visible when open is true', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', true);
    const panel = fixture.nativeElement.querySelector('.add-panel');
    expect(panel.classList.contains('add-panel--open')).toBe(true);
  });

  it('fetches weapons when open becomes true', () => {
    const spy = vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', false);
    expect(spy).not.toHaveBeenCalled();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('fetches armors when itemType is armor and open is true', () => {
    const spy = vi.spyOn(armorService, 'getArmorsRaw').mockReturnValue(of(buildArmorPage([])));
    createHost('armor', true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fetches loot when itemType is loot and open is true', () => {
    const spy = vi.spyOn(lootService, 'getLootRaw').mockReturnValue(of(buildLootPage([])));
    createHost('loot', true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('renders weapon items with damage, range, burden', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(
      of(buildWeaponPage([buildWeapon({ id: 1, name: 'Broadsword' })]))
    );
    const fixture = createHost('weapon', true);
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Broadsword');
    expect(el.textContent).toContain('2d10 phy');
    expect(el.textContent).toContain('MELEE');
  });

  it('renders armor items with base score', () => {
    vi.spyOn(armorService, 'getArmorsRaw').mockReturnValue(
      of(buildArmorPage([buildArmor({ id: 1, name: 'Plate', baseScore: 8 })]))
    );
    const fixture = createHost('armor', true);
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Plate');
    expect(el.textContent).toContain('8');
  });

  it('renders loot items with consumable badge when isConsumable', () => {
    vi.spyOn(lootService, 'getLootRaw').mockReturnValue(
      of(buildLootPage([buildLoot({ id: 1, name: 'Health Potion', isConsumable: true })]))
    );
    const fixture = createHost('loot', true);
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Health Potion');
    expect(el.querySelector('.add-panel__badge')).toBeTruthy();
  });

  it('renders loot item without consumable badge when not consumable', () => {
    vi.spyOn(lootService, 'getLootRaw').mockReturnValue(
      of(buildLootPage([buildLoot({ id: 2, name: 'Ancient Map', isConsumable: false })]))
    );
    const fixture = createHost('loot', true);
    expect(fixture.nativeElement.querySelector('.add-panel__badge')).toBeNull();
  });

  it('shows trait dropdown only for weapon type', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', true);
    const selects = fixture.nativeElement.querySelectorAll('.add-panel__select');
    expect(selects.length).toBe(2);
  });

  it('does not show trait dropdown for armor type', () => {
    vi.spyOn(armorService, 'getArmorsRaw').mockReturnValue(of(buildArmorPage([])));
    const fixture = createHost('armor', true);
    const selects = fixture.nativeElement.querySelectorAll('.add-panel__select');
    expect(selects.length).toBe(1);
  });

  it('shows consumable toggle only for loot type', () => {
    vi.spyOn(lootService, 'getLootRaw').mockReturnValue(of(buildLootPage([])));
    const fixture = createHost('loot', true);
    const toggle = fixture.nativeElement.querySelector('.add-panel__toggle');
    expect(toggle).toBeTruthy();
  });

  it('does not show consumable toggle for weapon type', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', true);
    const toggle = fixture.nativeElement.querySelector('.add-panel__toggle');
    expect(toggle).toBeNull();
  });

  it('tier filter change triggers new fetch with page 0 and updated tier', () => {
    const spy = vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', true);
    spy.mockClear();

    const panel = fixture.debugElement.children[0].componentInstance as InventoryAddPanel;
    panel.onTierChange('2');
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ tier: 2, page: 0 }));
  });

  it('consumable toggle change triggers new fetch', () => {
    const spy = vi.spyOn(lootService, 'getLootRaw').mockReturnValue(of(buildLootPage([])));
    const fixture = createHost('loot', true);
    spy.mockClear();

    const panel = fixture.debugElement.children[0].componentInstance as InventoryAddPanel;
    panel.onConsumableToggle();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ isConsumable: true, page: 0 }));
  });

  it('Load More button is visible when hasMore is true', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(
      of({ items: [buildWeapon()], currentPage: 0, totalPages: 2, totalElements: 2 })
    );
    const fixture = createHost('weapon', true);
    const loadMore = fixture.nativeElement.querySelector('.add-panel__load-more');
    expect(loadMore).toBeTruthy();
  });

  it('Load More button is hidden when hasMore is false', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(
      of({ items: [buildWeapon()], currentPage: 0, totalPages: 1, totalElements: 1 })
    );
    const fixture = createHost('weapon', true);
    const loadMore = fixture.nativeElement.querySelector('.add-panel__load-more');
    expect(loadMore).toBeNull();
  });

  it('Load More appends new results and increments page', () => {
    const weapon1 = buildWeapon({ id: 1, name: 'Sword' });
    const weapon2 = buildWeapon({ id: 2, name: 'Axe' });

    const spy = vi.spyOn(weaponService, 'getWeaponsRaw')
      .mockReturnValueOnce(of({ items: [weapon1], currentPage: 0, totalPages: 2, totalElements: 2 }))
      .mockReturnValueOnce(of({ items: [weapon2], currentPage: 1, totalPages: 2, totalElements: 2 }));

    const fixture = createHost('weapon', true);

    const loadMore = fixture.nativeElement.querySelector('.add-panel__load-more');
    loadMore.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(2);
    const itemNames = fixture.nativeElement.querySelectorAll('.add-panel__item-name');
    expect(itemNames.length).toBe(2);
    expect(itemNames[0].textContent).toContain('Sword');
    expect(itemNames[1].textContent).toContain('Axe');
  });

  it('clicking + button emits itemAdded with the correct item', () => {
    const weapon = buildWeapon({ id: 42, name: 'Legendary Sword' });
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([weapon])));

    const fixture = createHost('weapon', true);

    const addBtn = fixture.nativeElement.querySelector('.add-panel__add-btn');
    addBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.addedItem).toEqual(weapon);
  });

  it('close button emits closed event', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', true);

    const closeBtn = fixture.nativeElement.querySelector('.add-panel__close');
    closeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('shows empty state when no items found', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(of(buildWeaponPage([])));
    const fixture = createHost('weapon', true);

    const state = fixture.nativeElement.querySelector('.add-panel__state');
    expect(state?.textContent).toContain('No items found');
  });

  it('shows error state when fetch fails', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw').mockReturnValue(throwError(() => new Error('Network error')));
    const fixture = createHost('weapon', true);

    const state = fixture.nativeElement.querySelector('.add-panel__state--error');
    expect(state).toBeTruthy();
    expect(state.textContent).toContain('Failed to load');
  });

  it('filter change resets items before fetching again', () => {
    vi.spyOn(weaponService, 'getWeaponsRaw')
      .mockReturnValueOnce(of({ items: [buildWeapon({ id: 1 })], currentPage: 0, totalPages: 2, totalElements: 2 }))
      .mockReturnValueOnce(of({ items: [], currentPage: 0, totalPages: 1, totalElements: 0 }));

    const fixture = createHost('weapon', true);
    let items = fixture.nativeElement.querySelectorAll('.add-panel__item');
    expect(items.length).toBe(1);

    const panel = fixture.debugElement.children[0].componentInstance as InventoryAddPanel;
    panel.onTierChange('3');
    fixture.detectChanges();

    items = fixture.nativeElement.querySelectorAll('.add-panel__item');
    expect(items.length).toBe(0);
  });
});
