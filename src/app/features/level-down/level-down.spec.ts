import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LevelDown } from './level-down';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';

function makeSheetResponse(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return {
    id: 1,
    name: 'Kael',
    level: 10,
    evasion: 10,
    armorMax: 3,
    armorMarked: 0,
    majorDamageThreshold: 5,
    severeDamageThreshold: 10,
    agilityModifier: 2,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: true,
    finesseModifier: 1,
    finesseMarked: false,
    instinctModifier: -1,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: 0,
    knowledgeMarked: false,
    hitPointMax: 8,
    hitPointMarked: 2,
    stressMax: 6,
    stressMarked: 0,
    hopeMax: 5,
    hopeMarked: 1,
    gold: 25,
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
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('LevelDown', () => {
  let fixture: ComponentFixture<LevelDown>;
  let component: LevelDown;
  let mockService: {
    getCharacterSheet: ReturnType<typeof vi.fn>;
    undoLevelUp: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: { user: ReturnType<typeof vi.fn> };
  let mockRouter: Router;

  function createComponent(id: string, sheetResponse = of(makeSheetResponse())) {
    mockService = {
      getCharacterSheet: vi.fn().mockReturnValue(sheetResponse),
      undoLevelUp: vi.fn().mockReturnValue(of(makeSheetResponse({ level: 9 }))),
    };
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 1, username: 'test', email: 'test@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' }),
    };
    TestBed.configureTestingModule({
      imports: [LevelDown],
      providers: [
        provideRouter([]),
        { provide: CharacterSheetService, useValue: mockService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
      ],
    });
    mockRouter = TestBed.inject(Router);
    vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LevelDown);
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

  it('shows character name after loading', () => {
    createComponent('1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.max-level-name')?.textContent).toContain('Kael');
  });

  it('shows level badge', () => {
    createComponent('1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge-text')?.textContent).toContain('Level 10');
  });

  it('shows back to character link', () => {
    createComponent('1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('.max-level-back');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Back to Character');
  });

  it('shows level down button', () => {
    createComponent('1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('.max-level-level-down') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Level Down');
  });

  it('opens confirm dialog on level down click', () => {
    createComponent('1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('.max-level-level-down') as HTMLButtonElement;
    btn.click();
    expect(component.showConfirmDialog()).toBe(true);
  });

  it('calls undoLevelUp on confirm and navigates back', () => {
    createComponent('1');
    fixture.detectChanges();
    component.onLevelDownClick();
    component.onConfirm();
    expect(mockService.undoLevelUp).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/character', 1]);
  });

  it('closes dialog on cancel', () => {
    createComponent('1');
    fixture.detectChanges();
    component.onLevelDownClick();
    expect(component.showConfirmDialog()).toBe(true);
    component.onCancel();
    expect(component.showConfirmDialog()).toBe(false);
  });

  it('shows error for invalid character ID', () => {
    createComponent('abc');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-message')?.textContent).toContain('Invalid character ID');
  });

  it('shows error when character load fails', () => {
    createComponent('1', throwError(() => new Error('fail')));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-message')?.textContent).toContain('Failed to load character');
  });

  it('shows error when user does not own character', () => {
    createComponent('1', of(makeSheetResponse({ ownerId: 999 })));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-message')?.textContent).toContain('do not own');
  });
});
