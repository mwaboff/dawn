import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterSheet } from './character-sheet';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
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
  let mockService: { getCharacterSheet: ReturnType<typeof vi.fn> };

  function createComponent(id: string, serviceResponse = of(mockResponse)) {
    mockService = { getCharacterSheet: vi.fn().mockReturnValue(serviceResponse) };
    TestBed.configureTestingModule({
      imports: [CharacterSheet],
      providers: [
        { provide: CharacterSheetService, useValue: mockService },
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
});
