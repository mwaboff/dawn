import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CompanionPanel, CompanionStressChangedEvent } from './companion-panel';
import { CompanionApiResponse } from '../../../../shared/models/companion-api.model';
import { CompanionCreateSubmission, CompanionUpdateSubmission } from './components/companion-form-modal/companion-form-modal';
import { CompanionClassFeatureReminder } from '../../utils/companion-access.utils';

function buildCompanion(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    characterSheetId: 5,
    name: 'Forest Wolf',
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
    experiences: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

@Component({
  imports: [CompanionPanel],
  template: `
    <app-companion-panel
      [companions]="companions()"
      [proficiency]="proficiency()"
      [characterSheetId]="characterSheetId()"
      [canManage]="canManage()"
      [canCreate]="canCreate()"
      [saving]="saving()"
      [armorAvailable]="armorAvailable()"
      [errorMessage]="errorMessage()"
      [classFeatureReminders]="classFeatureReminders()"
      (companionCreated)="onCreated($event)"
      (companionUpdated)="onUpdated($event)"
      (companionDeleted)="onDeleted($event)"
      (companionStressChanged)="onStressChanged($event)"
      (markArmorInstead)="markArmorInsteadCount = markArmorInsteadCount + 1"
      (dismissError)="dismissErrorCount = dismissErrorCount + 1"
    />
  `,
})
class TestHost {
  companions = signal<CompanionApiResponse[]>([]);
  proficiency = signal(2);
  characterSheetId = signal(5);
  canManage = signal(true);
  canCreate = signal(true);
  saving = signal(false);
  armorAvailable = signal(false);
  errorMessage = signal<string | null>(null);
  classFeatureReminders = signal<CompanionClassFeatureReminder[]>([]);

  lastCreated: CompanionCreateSubmission | undefined;
  lastUpdated: CompanionUpdateSubmission | undefined;
  lastDeleted: number | undefined;
  lastStressChanged: CompanionStressChangedEvent | undefined;
  markArmorInsteadCount = 0;
  dismissErrorCount = 0;

  onCreated(e: CompanionCreateSubmission): void { this.lastCreated = e; }
  onUpdated(e: CompanionUpdateSubmission): void { this.lastUpdated = e; }
  onDeleted(id: number): void { this.lastDeleted = id; }
  onStressChanged(e: CompanionStressChangedEvent): void { this.lastStressChanged = e; }
}

describe('CompanionPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows an empty state when there are no companions', () => {
    expect(el.querySelector('.empty-state')?.textContent).toContain('No companions yet.');
  });

  it('renders one companion-card per companion', () => {
    host.companions.set([buildCompanion({ id: 1 }), buildCompanion({ id: 2, name: 'Shadow Cat' })]);
    fixture.detectChanges();

    expect(el.querySelectorAll('app-companion-card').length).toBe(2);
  });

  it('shows the Add Companion button when canCreate is true', () => {
    expect(el.querySelector('.companion-add-btn')).toBeTruthy();
  });

  it('hides the Add Companion button when canCreate is false', () => {
    host.canCreate.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.companion-add-btn')).toBeFalsy();
  });

  it('opens the create modal when Add Companion is clicked', () => {
    el.querySelector<HTMLButtonElement>('.companion-add-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('app-companion-form-modal')).toBeTruthy();
    expect(el.querySelector('.dialog-title')?.textContent?.trim()).toBe('Add Companion');
  });

  it('gives a non-creator no way to open the create modal', () => {
    host.canCreate.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.companion-add-btn')).toBeFalsy();
    expect(el.querySelector('app-companion-form-modal')).toBeFalsy();
  });

  it('closes the modal and emits companionCreated on submission', () => {
    el.querySelector<HTMLButtonElement>('.companion-add-btn')!.click();
    fixture.detectChanges();

    const nameInput = el.querySelector<HTMLInputElement>('#name')!;
    nameInput.value = 'Wolf';
    nameInput.dispatchEvent(new Event('input'));
    const attackInput = el.querySelector<HTMLInputElement>('#attackName')!;
    attackInput.value = 'Bite';
    attackInput.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('#companion-form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(host.lastCreated?.payload.name).toBe('Wolf');
    expect(el.querySelector('app-companion-form-modal')).toBeFalsy();
  });

  it('forwards companionDeleted with the right id', () => {
    host.companions.set([buildCompanion({ id: 42 })]);
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.expandable-card__header')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.roster-delete-btn')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.roster-inline-confirm-btn')!.click();

    expect(host.lastDeleted).toBe(42);
  });

  it('forwards companionStressChanged with the companion id attached', () => {
    host.companions.set([buildCompanion({ id: 42, stressMarked: 0 })]);
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.expandable-card__header')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.resource-box')!.click();

    expect(host.lastStressChanged).toEqual({ companionId: 42, stressMarked: 1 });
  });

  it('forwards classFeatureReminders to every companion card', () => {
    host.companions.set([buildCompanion({ id: 42 })]);
    host.classFeatureReminders.set([{ label: 'Battle-Bonded', text: 'A Beastbound Specialization reminder.' }]);
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.expandable-card__header')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.companion-reminder')?.textContent).toContain('A Beastbound Specialization reminder.');
  });

  it('shows and dismisses the error banner', () => {
    host.errorMessage.set('Failed to save companion.');
    fixture.detectChanges();

    expect(el.querySelector('.companion-panel-error')?.textContent).toContain('Failed to save companion.');
    el.querySelector<HTMLButtonElement>('.companion-panel-error__dismiss')!.click();

    expect(host.dismissErrorCount).toBe(1);
  });
});
