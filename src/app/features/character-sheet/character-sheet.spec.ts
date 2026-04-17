import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterSheet } from './character-sheet';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';

const mockResponse: CharacterSheetResponse = {
  id: 1,
  name: 'Aragorn',
  level: 5,
  evasion: 10,
  armorMax: 5,
  armorMarked: 0,
  majorDamageThreshold: 3,
  severeDamageThreshold: 6,
  agilityModifier: 0,
  agilityMarked: false,
  strengthModifier: 0,
  strengthMarked: false,
  finesseModifier: 0,
  finesseMarked: false,
  instinctModifier: 0,
  instinctMarked: false,
  presenceModifier: 0,
  presenceMarked: false,
  knowledgeModifier: 0,
  knowledgeMarked: false,
  hitPointMax: 10,
  hitPointMarked: 0,
  stressMax: 6,
  stressMarked: 0,
  hopeMax: 3,
  hopeMarked: 0,
  gold: 50,
  ownerId: 1,
  proficiency: 1,
  equippedDomainCardIds: [],
  vaultDomainCardIds: [],
  communityCardIds: [],
  ancestryCardIds: [],
  subclassCardIds: [],
  domainCardIds: [],
  inventoryWeapons: [],
  inventoryArmors: [],
  inventoryItems: [],
  experienceIds: [],
  createdAt: '2026-01-01T00:00:00',
  lastModifiedAt: '2026-01-01T00:00:00',
};

describe('CharacterSheet', () => {
  let fixture: ComponentFixture<CharacterSheet>;
  let component: CharacterSheet;
  let mockService: { getCharacterSheet: ReturnType<typeof vi.fn>; updateCharacterSheet: ReturnType<typeof vi.fn> };
  let mockAuthService: { user: ReturnType<typeof vi.fn> };

  function createComponent(id: string, serviceResponse = of(mockResponse)) {
    mockService = { getCharacterSheet: vi.fn().mockReturnValue(serviceResponse), updateCharacterSheet: vi.fn().mockReturnValue(of(mockResponse)) };
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 1, username: 'test', email: 'test@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' }),
    };
    TestBed.configureTestingModule({
      imports: [CharacterSheet],
      providers: [
        provideRouter([]),
        { provide: CharacterSheetService, useValue: mockService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => id } } },
        },
      ],
    });
    fixture = TestBed.createComponent(CharacterSheet);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the component', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('starts in loading state before detectChanges', () => {
    createComponent('1');

    expect(component.loading()).toBe(true);
    expect(component.error()).toBe(false);
    expect(component.characterSheet()).toBeNull();
  });

  it('shows character name after loading', () => {
    createComponent('1');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.sheet-name')?.textContent?.trim()).toBe('Aragorn');
  });

  it('shows owner name link when ownerName is present', () => {
    createComponent('1', of({ ...mockResponse, ownerName: 'TestUser' }));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const ownerLink = el.querySelector('.sheet-owner') as HTMLAnchorElement;
    expect(ownerLink).toBeTruthy();
    expect(ownerLink.textContent?.trim()).toBe('by TestUser');
    expect(ownerLink.pathname).toBe('/profile/1');
  });

  it('does not show owner link when ownerName is absent', () => {
    createComponent('1');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.sheet-owner')).toBeNull();
  });

  it('sets error state for non-numeric ID', () => {
    createComponent('abc');
    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('shows error UI for non-numeric ID', () => {
    createComponent('abc');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.sheet-error')).toBeTruthy();
    expect(el.querySelector('.error-title')?.textContent?.trim()).toBe('Character Not Found');
  });

  it('sets error state on service error', () => {
    createComponent('1', throwError(() => new Error('Server error')));
    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('shows error UI on service error', () => {
    createComponent('1', throwError(() => new Error('Server error')));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.sheet-error')).toBeTruthy();
  });

  it('calls service with correct ID and expand fields', () => {
    createComponent('42');
    fixture.detectChanges();

    expect(mockService.getCharacterSheet).toHaveBeenCalledWith(42, [
      'experiences',
      'communityCards',
      'ancestryCards',
      'class',
      'subclassCards',
      'domainCards',
      'inventoryWeapons',
      'inventoryArmors',
      'inventoryItems',
      'features',
      'costTags',
      'modifiers',
    ]);
  });

  it('does not call service for invalid ID', () => {
    createComponent('not-a-number');
    fixture.detectChanges();

    expect(mockService.getCharacterSheet).not.toHaveBeenCalled();
  });

  it('formatModifier formats positive values with +', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(component.formatModifier(2)).toBe('+2');
  });

  it('formatModifier formats negative values', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(component.formatModifier(-1)).toBe('-1');
  });

  it('formatModifier formats zero as +0', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(component.formatModifier(0)).toBe('+0');
  });

  describe('card expansion', () => {
    it('isCardExpanded returns false by default', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.isCardExpanded(1)).toBe(false);
    });

    it('toggleCard expands a collapsed card', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleCard(5);

      expect(component.isCardExpanded(5)).toBe(true);
    });

    it('toggleCard collapses an expanded card', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleCard(5);
      component.toggleCard(5);

      expect(component.isCardExpanded(5)).toBe(false);
    });

    it('toggling card X does not affect card Y', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleCard(5);

      expect(component.isCardExpanded(5)).toBe(true);
      expect(component.isCardExpanded(10)).toBe(false);
    });
  });

  describe('getRange', () => {
    it('returns [1,2,3] for n=3', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.getRange(3)).toEqual([1, 2, 3]);
    });

    it('returns [] for n=0', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.getRange(0)).toEqual([]);
    });
  });

  describe('resource tracking', () => {
    it('markedHp defaults to sheet hitPointMarked', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.markedHp()).toBe(0);
    });

    it('toggleResourceBox marks hp up to index', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleResourceBox('hp', 3);

      expect(component.markedHp()).toBe(3);
    });

    it('toggleResourceBox on the last marked hp box unmarks it', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleResourceBox('hp', 3);
      component.toggleResourceBox('hp', 3);

      expect(component.markedHp()).toBe(2);
    });

    it('toggleResourceBox marks stress independently', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleResourceBox('stress', 2);

      expect(component.markedStress()).toBe(2);
      expect(component.markedHp()).toBe(0);
    });

    it('toggleResourceBox marks hope independently', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleResourceBox('hope', 1);

      expect(component.markedHope()).toBe(1);
    });

    it('toggleResourceBox marks armor independently', () => {
      createComponent('1');
      fixture.detectChanges();

      component.toggleResourceBox('armor', 4);

      expect(component.markedArmor()).toBe(4);
    });
  });

  describe('gold management', () => {
    it('currentGold defaults to sheet gold value', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.currentGold()).toBe(50);
    });

    it('adjustGold adds a handful (1)', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(1);

      expect(component.currentGold()).toBe(51);
    });

    it('adjustGold adds a bag (10)', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(10);

      expect(component.currentGold()).toBe(60);
    });

    it('adjustGold adds a chest (100)', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(100);

      expect(component.currentGold()).toBe(150);
    });

    it('adjustGold subtracts a handful (1)', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(-1);

      expect(component.currentGold()).toBe(49);
    });

    it('adjustGold accumulates multiple adjustments', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(10);
      component.adjustGold(100);
      component.adjustGold(-1);

      expect(component.currentGold()).toBe(159);
    });

    it('adjustGold allows negative gold total', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(-100);

      expect(component.currentGold()).toBe(-50);
    });

    it('renders the gold total in the DOM', () => {
      createComponent('1');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gold-total__value')?.textContent?.trim()).toBe('50');
    });

    it('renders six gold denomination buttons', () => {
      createComponent('1');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.gold-btn').length).toBe(6);
    });

    it('applies negative class when gold is below zero', () => {
      createComponent('1');
      fixture.detectChanges();

      component.adjustGold(-100);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gold-total__value--negative')).toBeTruthy();
    });
  });

  describe('getSubSkills', () => {
    it('returns correct sub-skills for Agility', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.getSubSkills('Agility')).toEqual(['Sprint', 'Leap', 'Maneuver']);
    });

    it('returns empty array for unknown trait name', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.getSubSkills('Unknown')).toEqual([]);
    });
  });

  describe('isOwner', () => {
    it('returns true when user id matches sheet ownerId', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.isOwner()).toBe(true);
    });

    it('returns false when user id does not match sheet ownerId', () => {
      createComponent('1');
      mockAuthService.user.mockReturnValue({ id: 999, username: 'other', email: 'other@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' });
      fixture.detectChanges();

      expect(component.isOwner()).toBe(false);
    });

    it('returns false when no user is logged in', () => {
      createComponent('1');
      mockAuthService.user.mockReturnValue(null);
      fixture.detectChanges();

      expect(component.isOwner()).toBe(false);
    });
  });

  describe('canLevelUp', () => {
    it('returns true when owner and level < 10', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.canLevelUp()).toBe(true);
    });

    it('returns false when level is 10', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      fixture.detectChanges();

      expect(component.canLevelUp()).toBe(false);
    });

    it('returns false when not owner', () => {
      createComponent('1');
      mockAuthService.user.mockReturnValue({ id: 999, username: 'other', email: 'other@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' });
      fixture.detectChanges();

      expect(component.canLevelUp()).toBe(false);
    });
  });

  describe('canLevelDown', () => {
    it('returns true when owner and level is 10', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      fixture.detectChanges();

      expect(component.canLevelDown()).toBe(true);
    });

    it('returns false when level is below 10', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.canLevelDown()).toBe(false);
    });

    it('returns false when not owner', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      mockAuthService.user.mockReturnValue({ id: 999, username: 'other', email: 'other@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' });
      fixture.detectChanges();

      expect(component.canLevelDown()).toBe(false);
    });
  });

  describe('level up button', () => {
    it('renders when canLevelUp is true', () => {
      createComponent('1');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.level-up-btn')).toBeTruthy();
    });

    it('is hidden when canLevelUp is false', () => {
      createComponent('1');
      mockAuthService.user.mockReturnValue(null);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.level-up-btn')).toBeNull();
    });

    it('level-up link has correct href', () => {
      createComponent('1');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const link = el.querySelector('.level-up-btn') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.pathname).toBe('/character/1/level-up');
    });

    it('does not show Level+ at level 10', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.level-up-btn')).toBeNull();
    });
  });

  describe('level down button', () => {
    it('renders when canLevelDown is true (level 10)', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector('.level-down-btn');
      expect(btn).toBeTruthy();
      expect(btn?.textContent?.trim()).toBe('Level-');
    });

    it('is hidden when level is below 10', () => {
      createComponent('1');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.level-down-btn')).toBeNull();
    });

    it('level-down link has correct href', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const link = el.querySelector('.level-down-btn') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.pathname).toBe('/character/1/level-down');
    });

    it('level badge has can-level class at level 10', () => {
      const maxLevelResponse = { ...mockResponse, level: 10 };
      createComponent('1', of(maxLevelResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.level-badge--can-level')).toBeTruthy();
    });
  });

  describe('domain card swap', () => {
    const domainSheetResponse: CharacterSheetResponse = {
      ...mockResponse,
      equippedDomainCardIds: [10, 11],
      vaultDomainCardIds: [12],
      domainCards: [
        { id: 10, name: 'Fireball', features: [] },
        { id: 11, name: 'Ice Shield', features: [] },
        { id: 12, name: 'Wind Rush', features: [] },
      ],
    };

    it('onVaultCard moves card from equipped to vault', () => {
      createComponent('1', of(domainSheetResponse));
      fixture.detectChanges();

      component.onVaultCard(10);

      const sheet = component.characterSheet()!;
      expect(sheet.equippedDomainCards.map(c => c.id)).toEqual([11]);
      expect(sheet.vaultDomainCards.map(c => c.id)).toEqual([12, 10]);
    });

    it('onVaultCard calls updateCharacterSheet with new IDs', () => {
      createComponent('1', of(domainSheetResponse));
      fixture.detectChanges();

      component.onVaultCard(10);

      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        equippedDomainCardIds: [11],
        vaultDomainCardIds: [12, 10],
      });
    });

    it('onEquipCard moves card from vault to equipped', () => {
      createComponent('1', of(domainSheetResponse));
      fixture.detectChanges();

      component.onEquipCard(12);

      const sheet = component.characterSheet()!;
      expect(sheet.equippedDomainCards.map(c => c.id)).toEqual([10, 11, 12]);
      expect(sheet.vaultDomainCards).toEqual([]);
    });

    it('canEquipCard returns true when below max', () => {
      createComponent('1', of(domainSheetResponse));
      fixture.detectChanges();

      expect(component.canEquipCard()).toBe(true);
    });

    it('canEquipCard returns false when at max', () => {
      const fullSheet: CharacterSheetResponse = {
        ...mockResponse,
        equippedDomainCardIds: [1, 2, 3, 4, 5],
        vaultDomainCardIds: [6],
        domainCards: [
          { id: 1, name: 'A', features: [] },
          { id: 2, name: 'B', features: [] },
          { id: 3, name: 'C', features: [] },
          { id: 4, name: 'D', features: [] },
          { id: 5, name: 'E', features: [] },
          { id: 6, name: 'F', features: [] },
        ],
      };
      createComponent('1', of(fullSheet));
      fixture.detectChanges();

      expect(component.canEquipCard()).toBe(false);
    });

    it('onEquipCard does nothing when at max equipped', () => {
      const fullSheet: CharacterSheetResponse = {
        ...mockResponse,
        equippedDomainCardIds: [1, 2, 3, 4, 5],
        vaultDomainCardIds: [6],
        domainCards: [
          { id: 1, name: 'A', features: [] },
          { id: 2, name: 'B', features: [] },
          { id: 3, name: 'C', features: [] },
          { id: 4, name: 'D', features: [] },
          { id: 5, name: 'E', features: [] },
          { id: 6, name: 'F', features: [] },
        ],
      };
      createComponent('1', of(fullSheet));
      fixture.detectChanges();

      component.onEquipCard(6);

      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });
  });

  describe('equipment equip/unequip', () => {
    const weaponResponse = {
      ...mockResponse,
      inventoryWeapons: [
        { id: 100, weaponId: 100, equipped: true, slot: 'PRIMARY' as const, weapon: { id: 100, name: 'Longsword', trait: 'Strength', range: 'Melee', burden: 'One-handed', features: [] } },
        { id: 101, weaponId: 101, equipped: false, weapon: { id: 101, name: 'Shortbow', trait: 'Finesse', range: 'Ranged', burden: 'Two-handed', features: [] } },
      ],
    };

    const armorResponse = {
      ...mockResponse,
      inventoryArmors: [
        { id: 200, armorId: 200, equipped: true, armor: { id: 200, name: 'Chainmail', baseScore: 5, features: [] } },
        { id: 201, armorId: 201, equipped: false, armor: { id: 201, name: 'Leather', baseScore: 3, features: [] } },
      ],
    };

    it('isWeaponEquipped returns primary for equipped primary weapon', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      expect(component.isWeaponEquipped(100)).toBe('primary');
    });

    it('isWeaponEquipped returns null for unequipped weapon', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      expect(component.isWeaponEquipped(101)).toBeNull();
    });

    it('isArmorEquipped returns true for equipped armor', () => {
      createComponent('1', of(armorResponse));
      fixture.detectChanges();

      expect(component.isArmorEquipped(200)).toBe(true);
    });

    it('isArmorEquipped returns false for unequipped armor', () => {
      createComponent('1', of(armorResponse));
      fixture.detectChanges();

      expect(component.isArmorEquipped(201)).toBe(false);
    });

    it('canEquipPrimaryWeapon returns false when primary slot is occupied', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      expect(component.canEquipPrimaryWeapon()).toBe(false);
    });

    it('canEquipPrimaryWeapon returns true when primary slot is empty', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.canEquipPrimaryWeapon()).toBe(true);
    });

    it('canEquipArmor returns false when armor slot is occupied', () => {
      createComponent('1', of(armorResponse));
      fixture.detectChanges();

      expect(component.canEquipArmor()).toBe(false);
    });

    it('canEquipArmor returns true when armor slot is empty', () => {
      createComponent('1');
      fixture.detectChanges();

      expect(component.canEquipArmor()).toBe(true);
    });

    it('onEquipWeapon equips weapon to primary slot and calls service', () => {
      const unequippedResponse = {
        ...weaponResponse,
        inventoryWeapons: weaponResponse.inventoryWeapons.map(w => ({ ...w, equipped: false, slot: undefined })),
      };
      createComponent('1', of(unequippedResponse));
      fixture.detectChanges();

      component.onEquipWeapon({ weaponId: 100, inventoryEntryId: 100, slot: 'primary' });

      const sheet = component.characterSheet()!;
      expect(sheet.activePrimaryWeapon?.id).toBe(100);
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
      inventoryWeapons: [
        { weaponId: 100, equipped: true, slot: 'PRIMARY' },
        { weaponId: 101, equipped: false },
      ],
    });
    });

    it('onEquipWeapon equips weapon to secondary slot and calls service', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      component.onEquipWeapon({ weaponId: 101, inventoryEntryId: 101, slot: 'secondary' });

      const sheet = component.characterSheet()!;
      expect(sheet.activeSecondaryWeapon?.id).toBe(101);
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        inventoryWeapons: [
          { weaponId: 100, equipped: true, slot: 'PRIMARY' },
          { weaponId: 101, equipped: true, slot: 'SECONDARY' },
        ],
      });
    });

    it('onUnequipWeapon clears primary slot and calls service', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      component.onUnequipWeapon('primary');

      const sheet = component.characterSheet()!;
      expect(sheet.activePrimaryWeapon).toBeNull();
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
      inventoryWeapons: [
        { weaponId: 100, equipped: false },
        { weaponId: 101, equipped: false },
      ],
    });
    });

    it('onEquipArmor equips armor and calls service', () => {
      const unequippedArmorResponse = {
        ...armorResponse,
        inventoryArmors: armorResponse.inventoryArmors.map(a => ({ ...a, equipped: false })),
      };
      createComponent('1', of(unequippedArmorResponse));
      fixture.detectChanges();

      component.onEquipArmor({ armorId: 200, inventoryEntryId: 200 });

      const sheet = component.characterSheet()!;
      expect(sheet.activeArmor?.id).toBe(200);
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
      inventoryArmors: [
        { armorId: 200, equipped: true },
        { armorId: 201, equipped: false },
      ],
    });
    });

    it('onUnequipArmor clears armor and calls service', () => {
      createComponent('1', of(armorResponse));
      fixture.detectChanges();

      component.onUnequipArmor();

      const sheet = component.characterSheet()!;
      expect(sheet.activeArmor).toBeNull();
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
      inventoryArmors: [
        { armorId: 200, equipped: false },
        { armorId: 201, equipped: false },
      ],
    });
    });

    it('onEquipWeapon reverts on error', () => {
      const unequippedResponse = {
        ...weaponResponse,
        inventoryWeapons: weaponResponse.inventoryWeapons.map(w => ({ ...w, equipped: false, slot: undefined })),
      };
      createComponent('1', of(unequippedResponse));
      mockService.updateCharacterSheet.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.onEquipWeapon({ weaponId: 100, inventoryEntryId: 100, slot: 'primary' });

      const sheet = component.characterSheet()!;
      expect(sheet.activePrimaryWeapon).toBeNull();
    });

    it('onUnequipArmor reverts on error', () => {
      createComponent('1', of(armorResponse));
      mockService.updateCharacterSheet.mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.onUnequipArmor();

      const sheet = component.characterSheet()!;
      expect(sheet.activeArmor?.id).toBe(200);
    });

    it('onEquipWeapon prevents re-equipping an already-equipped entry', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      component.onEquipWeapon({ weaponId: 100, inventoryEntryId: 100, slot: 'secondary' });

      const sheet = component.characterSheet()!;
      expect(sheet.activeSecondaryWeapon).toBeNull();
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('renders equipped badge for equipped weapon in inventory', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const badges = Array.from(el.querySelectorAll('app-inventory-item-row .equipment-card__badge'));
      const primary = badges.find(b => b.textContent?.trim() === 'Primary');
      expect(primary).toBeTruthy();
    });

    it('renders equip buttons for unequipped weapon', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const equipBtns = el.querySelectorAll('.card-swap-btn--equip');
      expect(equipBtns.length).toBeGreaterThanOrEqual(2);
    });

    it('renders unequip button for equipped weapon', () => {
      createComponent('1', of(weaponResponse));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const unequipBtn = el.querySelector('.card-swap-btn--vault');
      expect(unequipBtn).toBeTruthy();
      expect(unequipBtn?.textContent).toContain('Unequip');
    });
  });

  describe('inventory add/remove', () => {
    it('allows adding the same weapon twice and calls the service each time', () => {
      createComponent('1');
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockReturnValue(of(mockResponse));

      const weapon = { id: 42, name: 'Shortbow' } as unknown;
      component.onAddInventoryItem({ type: 'weapon', item: weapon });
      component.onAddInventoryItem({ type: 'weapon', item: weapon });

      expect(mockService.updateCharacterSheet).toHaveBeenCalledTimes(2);
    });

    it('clears inventoryError and refetches the sheet on successful add', () => {
      createComponent('1');
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockReturnValue(of(mockResponse));
      mockService.getCharacterSheet.mockClear();

      component.onAddInventoryItem({ type: 'weapon', item: { id: 42, name: 'Shortbow' } as unknown });

      expect(component.inventoryError()).toBeNull();
      expect(mockService.getCharacterSheet).toHaveBeenCalled();
    });

    it('sets inventoryError and rolls back optimistic state on add failure', () => {
      createComponent('1');
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockReturnValue(throwError(() => new Error('fail')));

      component.onAddInventoryItem({ type: 'armor', item: { id: 42, name: 'Plate' } as unknown });

      expect(component.inventoryError()).toContain('Could not add armor');
      expect(component.characterSheet()!.inventoryArmors.length).toBe(0);
    });

    it('removes a weapon entry by inventoryEntryId and filters out only that row', () => {
      const responseWithTwoBows: CharacterSheetResponse = {
        ...mockResponse,
        inventoryWeapons: [
          { id: 101, weaponId: 7, equipped: false, weapon: { id: 7, name: 'Shortbow' } as never },
          { id: 102, weaponId: 7, equipped: false, weapon: { id: 7, name: 'Shortbow' } as never },
        ],
      };
      createComponent('1', of(responseWithTwoBows));
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockReturnValue(of(responseWithTwoBows));

      component.onRemoveInventoryItem({ type: 'weapon', inventoryEntryId: 101 });

      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        inventoryWeapons: [
          { weaponId: 7, equipped: false },
        ],
      });
    });

    it('onDismissInventoryError clears the error signal', () => {
      createComponent('1');
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockReturnValue(throwError(() => new Error('fail')));
      component.onAddInventoryItem({ type: 'loot', item: { id: 1, name: 'Potion' } as unknown });
      expect(component.inventoryError()).not.toBeNull();

      component.onDismissInventoryError();

      expect(component.inventoryError()).toBeNull();
    });
  });

  describe('debounced resource saving', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('toggleResourceBox triggers updateCharacterSheet after debounce for HP', () => {
      const saveResponse$ = new Subject<CharacterSheetResponse>();
      createComponent('1');
      mockService.updateCharacterSheet.mockReturnValue(saveResponse$.asObservable());
      fixture.detectChanges();

      component.toggleResourceBox('hp', 3);
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();

      vi.advanceTimersByTime(800);
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        hitPointMarked: 3,
        armorMarked: 0,
      });
    });

    it('batches rapid HP toggles into a single save', () => {
      const saveResponse$ = new Subject<CharacterSheetResponse>();
      createComponent('1');
      mockService.updateCharacterSheet.mockReturnValue(saveResponse$.asObservable());
      fixture.detectChanges();

      component.toggleResourceBox('hp', 3);
      component.toggleResourceBox('hp', 5);
      component.toggleResourceBox('hp', 7);

      vi.advanceTimersByTime(800);
      expect(mockService.updateCharacterSheet).toHaveBeenCalledTimes(1);
      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        hitPointMarked: 7,
        armorMarked: 0,
      });
    });

    it('isSavingHealth is true while save is in flight', () => {
      const saveResponse$ = new Subject<CharacterSheetResponse>();
      createComponent('1');
      mockService.updateCharacterSheet.mockReturnValue(saveResponse$.asObservable());
      fixture.detectChanges();

      component.toggleResourceBox('hp', 3);
      vi.advanceTimersByTime(800);

      expect(component.isSavingHealth()).toBe(true);

      saveResponse$.next(mockResponse);
      saveResponse$.complete();

      expect(component.isSavingHealth()).toBe(false);
    });

    it('adjustGold triggers updateCharacterSheet after debounce', () => {
      const saveResponse$ = new Subject<CharacterSheetResponse>();
      createComponent('1');
      mockService.updateCharacterSheet.mockReturnValue(saveResponse$.asObservable());
      fixture.detectChanges();

      component.adjustGold(10);
      vi.advanceTimersByTime(800);

      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        gold: 60,
      });
    });

    it('non-owner toggling resources does not call updateCharacterSheet', () => {
      createComponent('1');
      mockAuthService.user.mockReturnValue({ id: 999, username: 'other', email: 'other@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' });
      fixture.detectChanges();

      component.toggleResourceBox('hp', 3);
      vi.advanceTimersByTime(800);

      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('toggleResourceBox for hope triggers hopeStress save pipeline', () => {
      const saveResponse$ = new Subject<CharacterSheetResponse>();
      createComponent('1');
      mockService.updateCharacterSheet.mockReturnValue(saveResponse$.asObservable());
      fixture.detectChanges();

      component.toggleResourceBox('hope', 2);
      vi.advanceTimersByTime(800);

      expect(mockService.updateCharacterSheet).toHaveBeenCalledWith(1, {
        hopeMarked: 2,
        stressMarked: 0,
      });
    });
  });

  describe('weapon equip validation', () => {
    const oneHandedWeapon = (id: number, name: string) => ({
      id,
      name,
      trait: 'Strength',
      range: 'Melee',
      burden: 'ONE_HANDED',
      features: [],
    });

    const twoHandedWeapon = (id: number, name: string) => ({
      id,
      name,
      trait: 'Strength',
      range: 'Melee',
      burden: 'TWO_HANDED',
      features: [],
    });

    const sheetWithWeapons = (
      inventoryWeapons: NonNullable<CharacterSheetResponse['inventoryWeapons']>,
    ): CharacterSheetResponse => ({ ...mockResponse, inventoryWeapons });

    it('weaponConstraints reports empty when no weapons equipped', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            { id: 500, weaponId: 500, equipped: false, weapon: oneHandedWeapon(500, 'Dagger') },
          ]),
        ),
      );
      fixture.detectChanges();

      expect(component.weaponConstraints()).toEqual({
        primarySlotOccupied: false,
        secondarySlotOccupied: false,
        twoHandedEquipped: false,
      });
    });

    it('weaponConstraints reports primarySlotOccupied when a weapon is in PRIMARY', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 500,
              weaponId: 500,
              equipped: true,
              slot: 'PRIMARY',
              weapon: oneHandedWeapon(500, 'Longsword'),
            },
          ]),
        ),
      );
      fixture.detectChanges();

      const c = component.weaponConstraints();
      expect(c.primarySlotOccupied).toBe(true);
      expect(c.secondarySlotOccupied).toBe(false);
      expect(c.twoHandedEquipped).toBe(false);
    });

    it('weaponConstraints reports secondarySlotOccupied when a weapon is in SECONDARY', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 501,
              weaponId: 501,
              equipped: true,
              slot: 'SECONDARY',
              weapon: oneHandedWeapon(501, 'Dagger'),
            },
          ]),
        ),
      );
      fixture.detectChanges();

      const c = component.weaponConstraints();
      expect(c.primarySlotOccupied).toBe(false);
      expect(c.secondarySlotOccupied).toBe(true);
      expect(c.twoHandedEquipped).toBe(false);
    });

    it('weaponConstraints reports twoHandedEquipped when a TWO_HANDED weapon is equipped', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 502,
              weaponId: 502,
              equipped: true,
              slot: 'PRIMARY',
              weapon: twoHandedWeapon(502, 'Greataxe'),
            },
          ]),
        ),
      );
      fixture.detectChanges();

      const c = component.weaponConstraints();
      expect(c.primarySlotOccupied).toBe(true);
      expect(c.secondarySlotOccupied).toBe(false);
      expect(c.twoHandedEquipped).toBe(true);
    });

    it('weaponConstraints reports both slots and two-handed flags correctly when both slots full', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 503,
              weaponId: 503,
              equipped: true,
              slot: 'PRIMARY',
              weapon: oneHandedWeapon(503, 'Longsword'),
            },
            {
              id: 504,
              weaponId: 504,
              equipped: true,
              slot: 'SECONDARY',
              weapon: twoHandedWeapon(504, 'Greatbow'),
            },
          ]),
        ),
      );
      fixture.detectChanges();

      const c = component.weaponConstraints();
      expect(c.primarySlotOccupied).toBe(true);
      expect(c.secondarySlotOccupied).toBe(true);
      expect(c.twoHandedEquipped).toBe(true);
    });

    it('rejects equipping a second primary weapon with rule 1 message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 600,
              weaponId: 600,
              equipped: true,
              slot: 'PRIMARY',
              weapon: oneHandedWeapon(600, 'Longsword'),
            },
            {
              id: 601,
              weaponId: 601,
              equipped: false,
              weapon: oneHandedWeapon(601, 'Mace'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 601, inventoryEntryId: 601, slot: 'primary' });

      expect(component.inventoryError()).toBe(
        'Unequip your current primary weapon before equipping a new one.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('rejects equipping a second secondary weapon with rule 2 message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 610,
              weaponId: 610,
              equipped: true,
              slot: 'SECONDARY',
              weapon: oneHandedWeapon(610, 'Dagger'),
            },
            {
              id: 611,
              weaponId: 611,
              equipped: false,
              weapon: oneHandedWeapon(611, 'Shortsword'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 611, inventoryEntryId: 611, slot: 'secondary' });

      expect(component.inventoryError()).toBe(
        'Unequip your current secondary weapon before equipping a new one.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('rejects equipping a two-handed weapon when primary is occupied with rule 3a message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 620,
              weaponId: 620,
              equipped: true,
              slot: 'PRIMARY',
              weapon: oneHandedWeapon(620, 'Longsword'),
            },
            {
              id: 621,
              weaponId: 621,
              equipped: false,
              weapon: twoHandedWeapon(621, 'Greataxe'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 621, inventoryEntryId: 621, slot: 'primary' });

      expect(component.inventoryError()).toBe(
        'Two-handed weapons need both slots free. Unequip your other weapon first.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('rejects equipping a two-handed weapon when secondary is occupied with rule 3a message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 630,
              weaponId: 630,
              equipped: true,
              slot: 'SECONDARY',
              weapon: oneHandedWeapon(630, 'Dagger'),
            },
            {
              id: 631,
              weaponId: 631,
              equipped: false,
              weapon: twoHandedWeapon(631, 'Greataxe'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 631, inventoryEntryId: 631, slot: 'primary' });

      expect(component.inventoryError()).toBe(
        'Two-handed weapons need both slots free. Unequip your other weapon first.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('rejects equipping a two-handed weapon to secondary slot with rule 3a message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 640,
              weaponId: 640,
              equipped: false,
              weapon: twoHandedWeapon(640, 'Greatbow'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 640, inventoryEntryId: 640, slot: 'secondary' });

      expect(component.inventoryError()).toBe(
        'Two-handed weapons need both slots free. Unequip your other weapon first.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('rejects equipping a one-handed weapon when a two-handed is already equipped with rule 3b message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 650,
              weaponId: 650,
              equipped: true,
              slot: 'PRIMARY',
              weapon: twoHandedWeapon(650, 'Greataxe'),
            },
            {
              id: 651,
              weaponId: 651,
              equipped: false,
              weapon: oneHandedWeapon(651, 'Dagger'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 651, inventoryEntryId: 651, slot: 'primary' });

      expect(component.inventoryError()).toBe(
        'A two-handed weapon is already equipped. Unequip it before equipping another weapon.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('rejects equipping a one-handed weapon to secondary when a two-handed is already equipped with rule 3b message', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 660,
              weaponId: 660,
              equipped: true,
              slot: 'PRIMARY',
              weapon: twoHandedWeapon(660, 'Greataxe'),
            },
            {
              id: 661,
              weaponId: 661,
              equipped: false,
              weapon: oneHandedWeapon(661, 'Dagger'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();

      component.onEquipWeapon({ weaponId: 661, inventoryEntryId: 661, slot: 'secondary' });

      expect(component.inventoryError()).toBe(
        'A two-handed weapon is already equipped. Unequip it before equipping another weapon.',
      );
      expect(mockService.updateCharacterSheet).not.toHaveBeenCalled();
    });

    it('allows equipping a one-handed primary weapon to an empty slot', () => {
      createComponent(
        '1',
        of(
          sheetWithWeapons([
            {
              id: 700,
              weaponId: 700,
              equipped: false,
              weapon: oneHandedWeapon(700, 'Longsword'),
            },
          ]),
        ),
      );
      fixture.detectChanges();
      mockService.updateCharacterSheet.mockClear();
      mockService.updateCharacterSheet.mockReturnValue(of(mockResponse));

      component.onEquipWeapon({ weaponId: 700, inventoryEntryId: 700, slot: 'primary' });

      expect(component.inventoryError()).toBeNull();
      expect(mockService.updateCharacterSheet).toHaveBeenCalledTimes(1);
    });
  });
});
