import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CompanionFormModal, CompanionCreateSubmission, CompanionUpdateSubmission } from './companion-form-modal';
import { CompanionApiResponse } from '../../../../../../shared/models/companion-api.model';

function buildCompanion(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 9,
    characterSheetId: 1,
    name: 'Forest Wolf',
    description: 'A loyal wolf',
    evasion: 12,
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
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

@Component({
  imports: [CompanionFormModal],
  template: `
    <app-companion-form-modal
      [mode]="mode()"
      [characterSheetId]="characterSheetId()"
      [companion]="companion()"
      [processing]="processing()"
      (dismissed)="onDismissed()"
      (created)="onCreated($event)"
      (updated)="onUpdated($event)"
    />
  `,
})
class TestHost {
  mode = signal<'create' | 'edit'>('create');
  characterSheetId = signal(1);
  companion = signal<CompanionApiResponse | null>(null);
  processing = signal(false);
  dismissedCount = 0;
  lastCreated: CompanionCreateSubmission | undefined;
  lastUpdated: CompanionUpdateSubmission | undefined;

  onDismissed(): void {
    this.dismissedCount++;
  }

  onCreated(event: CompanionCreateSubmission): void {
    this.lastCreated = event;
  }

  onUpdated(event: CompanionUpdateSubmission): void {
    this.lastUpdated = event;
  }
}

describe('CompanionFormModal', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  // The modal is always `@if`-gated by its real caller (companion-panel.html), so a fresh
  // instance is created with `mode`/`companion` already at their final value -- exactly what
  // this helper reproduces. The component reads those inputs once, in its constructor, to build
  // the reactive form; it is not designed to rebuild the form if they change on a *live*
  // instance (nothing in this codebase's other `@if`-gated dialogs does either).
  function create(mode: 'create' | 'edit', companion: CompanionApiResponse | null = null): void {
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    host.mode.set(mode);
    host.companion.set(companion);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    create('create');
  });

  function setInput(name: string, value: string): void {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${name}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    el.querySelector<HTMLFormElement>('#companion-form')!.dispatchEvent(new Event('submit'));
  }

  it('shows the create title in create mode', () => {
    expect(el.querySelector('.dialog-title')?.textContent?.trim()).toBe('Add Companion');
  });

  it('shows the edit title in edit mode', () => {
    create('edit', buildCompanion());

    expect(el.querySelector('.dialog-title')?.textContent?.trim()).toBe('Edit Companion');
  });

  it('prefills the form with the companion base stats in edit mode', () => {
    create('edit', buildCompanion({ name: 'Shadow Cat', baseEvasion: 14 }));

    const nameInput = el.querySelector<HTMLInputElement>('#name')!;
    const evasionInput = el.querySelector<HTMLInputElement>('#evasion')!;
    expect(nameInput.value).toBe('Shadow Cat');
    expect(evasionInput.value).toBe('14');
  });

  it('defaults the create form to the printed starting values', () => {
    const rangeSelect = el.querySelector<HTMLSelectElement>('#attackRange')!;
    const diceSelect = el.querySelector<HTMLSelectElement>('#damageDice')!;
    const damageTypeSelect = el.querySelector<HTMLSelectElement>('#damageType')!;
    const evasionInput = el.querySelector<HTMLInputElement>('#evasion')!;
    expect(rangeSelect.value).toBe('MELEE');
    expect(diceSelect.value).toBe('D6');
    expect(damageTypeSelect.value).toBe('PHYSICAL');
    expect(evasionInput.value).toBe('10');
  });

  it('prefills damageType from the companion in edit mode', () => {
    create('edit', buildCompanion({ damageType: 'MAGIC' }));

    const damageTypeSelect = el.querySelector<HTMLSelectElement>('#damageType')!;
    expect(damageTypeSelect.value).toBe('MAGIC');
  });

  it('shows the Experiences section only in create mode', () => {
    expect(el.querySelector('app-experience-selector')).toBeTruthy();

    create('edit', buildCompanion());

    expect(el.querySelector('app-experience-selector')).toBeFalsy();
  });

  it('does not emit created when required fields are blank', () => {
    submit();

    expect(host.lastCreated).toBeUndefined();
  });

  it('emits created with every current field value, not just dirty ones', () => {
    setInput('name', 'Wolf');
    setInput('attackName', 'Bite');
    submit();

    expect(host.lastCreated?.payload).toEqual({
      characterSheetId: 1,
      name: 'Wolf',
      description: undefined,
      evasion: 10,
      attackName: 'Bite',
      attackRange: 'MELEE',
      damageDice: 'D6',
      damageType: 'PHYSICAL',
      stressMax: 3,
    });
  });

  it('emits dismissed when Cancel is clicked', () => {
    el.querySelector<HTMLButtonElement>('.dialog-btn--cancel')!.click();

    expect(host.dismissedCount).toBe(1);
  });

  it('does not dismiss while processing', () => {
    host.processing.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLElement>('.dialog-backdrop')!.click();

    expect(host.dismissedCount).toBe(0);
  });

  it('emits updated with only the changed field on edit', () => {
    create('edit', buildCompanion());

    setInput('name', 'Renamed Wolf');
    submit();

    expect(host.lastUpdated).toEqual({ id: 9, payload: { name: 'Renamed Wolf' } });
  });
});
