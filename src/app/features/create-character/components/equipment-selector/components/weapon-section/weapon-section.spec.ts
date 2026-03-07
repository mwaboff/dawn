import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { WeaponSection } from './weapon-section';
import { WeaponService, PaginatedCards } from '../../../../services/weapon.service';
import { CardData } from '../../../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildCardData(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Broadsword',
    description: '',
    cardType: 'weapon',
    tags: ['1d8', 'Melee', 'One-Handed', 'Strength'],
    metadata: {
      isPrimary: true,
      burden: 'ONE_HANDED',
      damageType: 'PHYSICAL',
      trait: 'STRENGTH',
      range: 'MELEE',
      tier: 1,
      damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL', notation: '1d8' },
      modifiers: [],
    },
    ...overrides,
  };
}

function buildPaginatedCards(cards: CardData[] = []): PaginatedCards {
  return {
    cards,
    currentPage: 0,
    totalPages: 1,
    totalElements: cards.length,
  };
}

describe('WeaponSection', () => {
  let fixture: ComponentFixture<WeaponSection>;
  let component: WeaponSection;
  let weaponServiceMock: { getWeapons: ReturnType<typeof vi.fn> };

  const primaryCards = [
    buildCardData({ id: 1, name: 'Broadsword', metadata: { isPrimary: true, burden: 'ONE_HANDED', damageType: 'PHYSICAL', trait: 'STRENGTH', range: 'MELEE', tier: 1, damage: {}, modifiers: [] } }),
    buildCardData({ id: 2, name: 'Greatsword', metadata: { isPrimary: true, burden: 'TWO_HANDED', damageType: 'PHYSICAL', trait: 'STRENGTH', range: 'MELEE', tier: 1, damage: {}, modifiers: [] } }),
  ];

  const secondaryCards = [
    buildCardData({ id: 10, name: 'Round Shield', metadata: { isPrimary: false, burden: 'ONE_HANDED', damageType: 'PHYSICAL', trait: 'AGILITY', range: 'MELEE', tier: 1, damage: {}, modifiers: [] } }),
  ];

  beforeEach(async () => {
    weaponServiceMock = {
      getWeapons: vi.fn().mockReturnValue(of(buildPaginatedCards(primaryCards))),
    };

    await TestBed.configureTestingModule({
      imports: [WeaponSection],
      providers: [{ provide: WeaponService, useValue: weaponServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(WeaponSection);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load primary weapons on init', () => {
    fixture.detectChanges();
    expect(weaponServiceMock.getWeapons).toHaveBeenCalledWith({
      page: 0,
      isPrimary: true,
      tier: 1,
      damageType: 'PHYSICAL',
    });
    expect(component.primaryWeapons()).toHaveLength(2);
  });

  it('should set loading state while fetching', () => {
    expect(component.primaryLoading()).toBe(false);
    fixture.detectChanges();
    expect(component.primaryLoading()).toBe(false);
    expect(component.primaryError()).toBe(false);
  });

  it('should set error state on failed fetch', () => {
    weaponServiceMock.getWeapons.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.primaryError()).toBe(true);
    expect(component.primaryLoading()).toBe(false);
  });

  it('should select primary weapon on card click', () => {
    fixture.detectChanges();
    const card = primaryCards[0];
    component.onPrimaryCardClicked(card);
    expect(component.selectedPrimary()?.id).toBe(card.id);
  });

  it('should deselect primary when clicking same card', () => {
    fixture.detectChanges();
    const card = primaryCards[0];
    component.onPrimaryCardClicked(card);
    expect(component.selectedPrimary()?.id).toBe(card.id);
    component.onPrimaryCardClicked(card);
    expect(component.selectedPrimary()).toBeNull();
  });

  it('should enable secondary toggle for one-handed weapon', () => {
    fixture.detectChanges();
    const oneHanded = primaryCards[0];
    component.onPrimaryCardClicked(oneHanded);
    expect(component.canSelectSecondary()).toBe(true);
  });

  it('should disable secondary toggle for two-handed weapon', () => {
    fixture.detectChanges();
    const twoHanded = primaryCards[1];
    component.onPrimaryCardClicked(twoHanded);
    expect(component.canSelectSecondary()).toBe(false);
  });

  it('should clear secondary when switching from one-handed to two-handed', () => {
    weaponServiceMock.getWeapons.mockImplementation((opts: Record<string, unknown>) => {
      if (opts['isPrimary'] === false) return of(buildPaginatedCards(secondaryCards));
      return of(buildPaginatedCards(primaryCards));
    });
    fixture.detectChanges();

    component.onPrimaryCardClicked(primaryCards[0]);
    component.onSecondaryCardClicked(secondaryCards[0]);
    expect(component.selectedSecondary()?.id).toBe(10);

    component.onPrimaryCardClicked(primaryCards[1]);
    expect(component.selectedSecondary()).toBeNull();
    expect(component.canSelectSecondary()).toBe(false);
  });

  it('should render filter buttons always', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const filterBtns = compiled.querySelectorAll('.filter-btn');
    expect(filterBtns).toHaveLength(4);
    expect(filterBtns[0].textContent?.trim()).toBe('Primary');
    expect(filterBtns[1].textContent?.trim()).toBe('Secondary');
    expect(filterBtns[2].textContent?.trim()).toBe('Physical');
    expect(filterBtns[3].textContent?.trim()).toBe('Magic');
  });

  it('should disable secondary button when no one-handed primary selected', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const secondaryBtn = compiled.querySelectorAll('.filter-btn')[1] as HTMLButtonElement;
    expect(secondaryBtn.disabled).toBe(true);
  });

  it('should enable secondary button when one-handed primary selected', () => {
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const secondaryBtn = compiled.querySelectorAll('.filter-btn')[1] as HTMLButtonElement;
    expect(secondaryBtn.disabled).toBe(false);
  });

  it('should disable magic button when hasMagicAccess is false', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const magicBtn = compiled.querySelectorAll('.filter-btn')[3] as HTMLButtonElement;
    expect(magicBtn.disabled).toBe(true);
  });

  it('should enable magic button when hasMagicAccess is true', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const magicBtn = compiled.querySelectorAll('.filter-btn')[3] as HTMLButtonElement;
    expect(magicBtn.disabled).toBe(false);
  });

  it('should keep damage type buttons enabled on secondary slot', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(secondaryCards)));
    component.onSlotChange('SECONDARY');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const physicalBtn = compiled.querySelectorAll('.filter-btn')[2] as HTMLButtonElement;
    const magicBtn = compiled.querySelectorAll('.filter-btn')[3] as HTMLButtonElement;
    expect(physicalBtn.disabled).toBe(false);
    expect(magicBtn.disabled).toBe(false);
  });

  it('should load secondary weapons with damageType when switching to secondary slot', () => {
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    weaponServiceMock.getWeapons.mockClear();
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(secondaryCards)));

    component.onSlotChange('SECONDARY');

    expect(weaponServiceMock.getWeapons).toHaveBeenCalledWith({
      page: 0,
      isPrimary: false,
      tier: 1,
      damageType: 'PHYSICAL',
    });
  });

  it('should not switch to secondary when canSelectSecondary is false', () => {
    fixture.detectChanges();
    component.onSlotChange('SECONDARY');
    expect(component.weaponSlot()).toBe('PRIMARY');
  });

  it('should dispatch card click to correct handler based on slot', () => {
    weaponServiceMock.getWeapons.mockImplementation((opts: Record<string, unknown>) => {
      if (opts['isPrimary'] === false) return of(buildPaginatedCards(secondaryCards));
      return of(buildPaginatedCards(primaryCards));
    });
    fixture.detectChanges();

    component.onCardClicked(primaryCards[0]);
    expect(component.selectedPrimary()?.id).toBe(1);

    component.onSlotChange('SECONDARY');
    component.onCardClicked(secondaryCards[0]);
    expect(component.selectedSecondary()?.id).toBe(10);
  });

  it('should reload with magic damage type when filter changed', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    weaponServiceMock.getWeapons.mockClear();

    component.onDamageFilterChange('MAGIC');

    expect(weaponServiceMock.getWeapons).toHaveBeenCalledWith({
      page: 0,
      isPrimary: true,
      tier: 1,
      damageType: 'MAGIC',
    });
  });

  it('should reload secondary weapons when damage filter changed on secondary slot', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(secondaryCards)));
    component.onSlotChange('SECONDARY');
    weaponServiceMock.getWeapons.mockClear();

    component.onDamageFilterChange('MAGIC');

    expect(component.damageFilter()).toBe('MAGIC');
    expect(weaponServiceMock.getWeapons).toHaveBeenCalledWith({
      page: 0,
      isPrimary: false,
      tier: 1,
      damageType: 'MAGIC',
    });
  });

  it('should preserve primary selection when damage filter changes on primary slot', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    expect(component.selectedPrimary()?.id).toBe(1);

    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards([])));
    component.onDamageFilterChange('MAGIC');

    expect(component.selectedPrimary()?.id).toBe(1);
  });

  it('should preserve secondary selection when damage filter changes on secondary slot', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(secondaryCards)));
    component.onSlotChange('SECONDARY');
    component.onSecondaryCardClicked(secondaryCards[0]);
    expect(component.selectedSecondary()?.id).toBe(10);

    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards([])));
    component.onDamageFilterChange('MAGIC');

    expect(component.selectedSecondary()?.id).toBe(10);
  });

  it('should preserve secondary selection when damage filter changes on primary slot', () => {
    fixture.componentRef.setInput('hasMagicAccess', true);
    fixture.detectChanges();
    component.onPrimaryCardClicked(primaryCards[0]);
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(secondaryCards)));
    component.onSlotChange('SECONDARY');
    component.onSecondaryCardClicked(secondaryCards[0]);
    expect(component.selectedSecondary()?.id).toBe(10);

    component.onSlotChange('PRIMARY');
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(primaryCards)));
    component.onDamageFilterChange('MAGIC');

    expect(component.selectedSecondary()?.id).toBe(10);
  });

  it('should emit selection on primary card click', () => {
    fixture.detectChanges();
    let emitted: { primary: CardData | null; secondary: CardData | null } | undefined;
    component.weaponSelected.subscribe(v => (emitted = v));

    component.onPrimaryCardClicked(primaryCards[0]);
    expect(emitted?.primary?.id).toBe(1);
    expect(emitted?.secondary).toBeNull();
  });

  it('should select and deselect secondary weapon', () => {
    fixture.detectChanges();
    const card = secondaryCards[0];
    component.onSecondaryCardClicked(card);
    expect(component.selectedSecondary()?.id).toBe(card.id);
    component.onSecondaryCardClicked(card);
    expect(component.selectedSecondary()).toBeNull();
  });

  it('should restore initial selections on init', () => {
    const primary = primaryCards[0];
    const secondary = secondaryCards[0];
    fixture.componentRef.setInput('initialPrimary', primary);
    fixture.componentRef.setInput('initialSecondary', secondary);
    fixture.detectChanges();

    expect(component.selectedPrimary()?.id).toBe(primary.id);
    expect(component.selectedSecondary()?.id).toBe(secondary.id);
  });

  it('should show active weapons based on current slot', () => {
    fixture.detectChanges();
    expect(component.activeWeapons()).toEqual(component.primaryWeapons());

    component.onPrimaryCardClicked(primaryCards[0]);
    weaponServiceMock.getWeapons.mockReturnValue(of(buildPaginatedCards(secondaryCards)));
    component.onSlotChange('SECONDARY');

    expect(component.activeWeapons()).toEqual(component.secondaryWeapons());
  });
});
