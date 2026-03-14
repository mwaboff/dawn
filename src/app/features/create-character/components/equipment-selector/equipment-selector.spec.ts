import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EquipmentSelector } from './equipment-selector';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { EquipmentSelections } from '../../models/equipment.model';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildCardData(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Broadsword',
    description: '',
    cardType: 'weapon',
    ...overrides,
  };
}

describe('EquipmentSelector', () => {
  let fixture: ComponentFixture<EquipmentSelector>;
  let component: EquipmentSelector;

  beforeEach(async () => {
    const weaponServiceMock = {
      getWeapons: vi.fn().mockReturnValue(of({ cards: [], currentPage: 0, totalPages: 0, totalElements: 0 })),
    };
    const armorServiceMock = {
      getArmors: vi.fn().mockReturnValue(of({ cards: [], currentPage: 0, totalPages: 0, totalElements: 0 })),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentSelector],
      providers: [
        { provide: WeaponService, useValue: weaponServiceMock },
        { provide: ArmorService, useValue: armorServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentSelector);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should start on weapon sub-step', () => {
    fixture.detectChanges();
    expect(component.activeSubStep()).toBe('weapon');
  });

  it('should switch to armor sub-step', () => {
    fixture.detectChanges();
    component.onSubStepSelected('armor');
    expect(component.activeSubStep()).toBe('armor');
  });

  it('should render weapon section by default', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-weapon-section')).toBeTruthy();
    expect(compiled.querySelector('app-armor-section')).toBeFalsy();
  });

  it('should render armor section when armor sub-step active', () => {
    fixture.detectChanges();
    component.onSubStepSelected('armor');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-armor-section')).toBeTruthy();
    expect(compiled.querySelector('app-weapon-section')).toBeFalsy();
  });

  it('should render sub-step tabs', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('.substep-tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent?.trim()).toBe('Weapons');
    expect(tabs[1].textContent?.trim()).toBe('Armor');
  });

  it('should emit equipment on weapon selection', () => {
    fixture.detectChanges();
    let emitted: EquipmentSelections | undefined;
    component.equipmentChanged.subscribe(v => (emitted = v));

    const weapon = buildCardData({ id: 1, name: 'Sword' });
    component.onWeaponSelected({ primary: weapon, secondary: null });

    expect(emitted?.primaryWeapon?.id).toBe(1);
    expect(emitted?.secondaryWeapon).toBeNull();
  });

  it('should emit equipment on armor selection', () => {
    fixture.detectChanges();
    let emitted: EquipmentSelections | undefined;
    component.equipmentChanged.subscribe(v => (emitted = v));

    const armor = buildCardData({ id: 2, name: 'Chainmail', cardType: 'armor' });
    component.onArmorSelected(armor);

    expect(emitted?.armor?.id).toBe(2);
  });

  it('should skip from weapon to armor', () => {
    fixture.detectChanges();
    component.onSkip();
    expect(component.activeSubStep()).toBe('armor');
  });

  it('should emit on skip from armor', () => {
    fixture.detectChanges();
    component.onSubStepSelected('armor');
    let emitted: EquipmentSelections | undefined;
    component.equipmentChanged.subscribe(v => (emitted = v));

    component.onSkip();
    expect(emitted).toBeDefined();
  });

  it('should apply vault design class to wrapper', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const wrapper = compiled.querySelector('.equipment-selector');
    expect(wrapper?.classList.contains('equipment-selector--vault')).toBe(true);
  });

  it('should restore selections from initialSelections input', () => {
    const weapon = buildCardData({ id: 1, name: 'Sword' });
    const armor = buildCardData({ id: 2, name: 'Chainmail', cardType: 'armor' });
    const initial: EquipmentSelections = {
      primaryWeapon: weapon,
      secondaryWeapon: null,
      armor,
    };
    fixture.componentRef.setInput('initialSelections', initial);
    fixture.detectChanges();

    expect(component.selections().primaryWeapon?.id).toBe(1);
    expect(component.selections().armor?.id).toBe(2);
  });
});
