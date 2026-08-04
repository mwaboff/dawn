import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanionStep } from './companion-step';
import { CompanionApiResponse } from '../../../../shared/models/companion-api.model';

function makeRestorable(id: number, name: string): CompanionApiResponse {
  return {
    id,
    characterSheetId: 1,
    name,
    evasion: 10,
    baseEvasion: 10,
    attackName: 'Bite',
    attackRange: 'MELEE',
    baseAttackRange: 'MELEE',
    damageDice: 'D6',
    baseDamageDice: 'D6',
    attackDiceCount: 1,
    damageType: 'PHYSICAL',
    stressMax: 3,
    baseStressMax: 3,
    stressMarked: 0,
    outOfScene: false,
    origin: 'SUBCLASS_FEATURE',
    advancesOnLevelUp: true,
    trainings: [],
    remainingByOption: {},
    createdAt: '',
    lastModifiedAt: '',
  };
}

describe('CompanionStep', () => {
  let fixture: ComponentFixture<CompanionStep>;
  let component: CompanionStep;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CompanionStep] }).compileComponents();
    fixture = TestBed.createComponent(CompanionStep);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('characterSheetId', 1);
  });

  it('shows the intro and a create button when nothing is selected yet', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.companion-step__intro')).toBeTruthy();
    expect(compiled.textContent).toContain('Create New Companion');
  });

  it('lists a Restore button per restorable companion', () => {
    fixture.componentRef.setInput('restorableCompanions', [makeRestorable(5, 'Rufus'), makeRestorable(6, 'Whiskers')]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Restore Rufus');
    expect(compiled.textContent).toContain('Restore Whiskers');
  });

  it('opens the create modal when "Create New Companion" is clicked', () => {
    fixture.detectChanges();
    component.openCreateModal();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-companion-form-modal')).toBeTruthy();
  });

  it('closes the create modal on dismissal without emitting a selection', () => {
    let emitted: unknown;
    component.selectionChanged.subscribe(v => (emitted = v));
    component.openCreateModal();

    component.onCreateDismissed();

    expect(component.showCreateModal()).toBe(false);
    expect(emitted).toBeUndefined();
  });

  it('stages a create draft and emits it when the form is submitted', () => {
    let emitted: unknown;
    component.selectionChanged.subscribe(v => (emitted = v));
    component.openCreateModal();

    const draft = {
      payload: { characterSheetId: 1, name: 'Rufus', attackName: 'Bite', attackRange: 'MELEE' as const, damageDice: 'D6' as const },
      experiences: [],
    };
    component.onDraftCreated(draft);

    expect(component.showCreateModal()).toBe(false);
    expect(component.selection()).toEqual({ mode: 'create', draft });
    expect(emitted).toEqual({ mode: 'create', draft });
  });

  it('emits a restore selection when a restorable companion is chosen', () => {
    let emitted: unknown;
    component.selectionChanged.subscribe(v => (emitted = v));

    component.onRestoreChosen(makeRestorable(5, 'Rufus'));

    expect(component.selection()).toEqual({ mode: 'restore', companionId: 5, name: 'Rufus' });
    expect(emitted).toEqual({ mode: 'restore', companionId: 5, name: 'Rufus' });
  });

  it('clears the selection and emits null on "Change"', () => {
    component.onRestoreChosen(makeRestorable(5, 'Rufus'));
    let emitted: unknown = 'unset';
    component.selectionChanged.subscribe(v => (emitted = v));

    component.onChangeSelection();

    expect(component.selection()).toBeNull();
    expect(emitted).toBeNull();
  });

  it('seeds the selection from initialSelection on init, for back-navigation', () => {
    fixture.componentRef.setInput('initialSelection', { mode: 'restore', companionId: 5, name: 'Rufus' });
    fixture.detectChanges();

    expect(component.selection()).toEqual({ mode: 'restore', companionId: 5, name: 'Rufus' });
  });
});
