import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
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
  inventoryWeaponIds: [],
  inventoryArmorIds: [],
  inventoryItemIds: [],
  experienceIds: [],
  createdAt: '2026-01-01T00:00:00',
  lastModifiedAt: '2026-01-01T00:00:00',
};

describe('CharacterSheet', () => {
  let fixture: ComponentFixture<CharacterSheet>;
  let component: CharacterSheet;
  let mockService: { getCharacterSheet: ReturnType<typeof vi.fn>; updateCharacterSheet: ReturnType<typeof vi.fn> };
  let mockAuthService: { user: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  function createComponent(id: string, serviceResponse = of(mockResponse)) {
    mockService = { getCharacterSheet: vi.fn().mockReturnValue(serviceResponse), updateCharacterSheet: vi.fn().mockReturnValue(of(mockResponse)) };
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 1, username: 'test', email: 'test@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' }),
    };
    mockRouter = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CharacterSheet],
      providers: [
        { provide: CharacterSheetService, useValue: mockService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
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
      'activePrimaryWeapon',
      'activeSecondaryWeapon',
      'activeArmor',
      'communityCards',
      'ancestryCards',
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

    it('onLevelUp navigates to /character/:id/level-up', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onLevelUp();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/character', 1, 'level-up']);
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
});
