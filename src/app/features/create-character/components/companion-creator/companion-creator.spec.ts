import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { CompanionCreator } from './companion-creator';
import { CompanionDraft } from '../../models/companion-draft.model';

@Component({
  imports: [CompanionCreator],
  template: `
    <app-companion-creator [initialDraft]="initialDraft()" (draftChanged)="onDraftChanged($event)" />
  `,
})
class TestHost {
  initialDraft = signal<CompanionDraft | null>(null);
  lastDraft: CompanionDraft | null | undefined;

  onDraftChanged(draft: CompanionDraft | null): void {
    this.lastDraft = draft;
  }
}

describe('CompanionCreator', () => {
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

  function setInput(name: string, value: string): void {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${name}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function toggleOn(): void {
    const checkbox = el.querySelector<HTMLInputElement>('.companion-toggle input[type="checkbox"]')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('defaults to skipped: toggle off, no form rendered, null draft', () => {
    expect(el.querySelector('.companion-sheet')).toBeFalsy();
    expect(el.querySelector('.companion-step__empty')).toBeTruthy();
  });

  it('reveals the companion form when the toggle is switched on', () => {
    toggleOn();

    expect(el.querySelector('.companion-sheet')).toBeTruthy();
    expect(el.querySelectorAll('.companion-experience-row').length).toBe(2);
  });

  it('emits null while the toggle is off', () => {
    fixture.detectChanges();
    expect(host.lastDraft).toBeUndefined();
  });

  it('emits null when the toggle is switched back off, even with data typed in', () => {
    toggleOn();
    setInput('name', 'Rufus');
    expect(host.lastDraft).not.toBeNull();

    const checkbox = el.querySelector<HTMLInputElement>('.companion-toggle input[type="checkbox"]')!;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastDraft).toBeNull();
  });

  it('defaults the form to the printed starting values once toggled on', () => {
    toggleOn();

    const evasionInput = el.querySelector<HTMLInputElement>('#evasion')!;
    const rangeSelect = el.querySelector<HTMLSelectElement>('#attackRange')!;
    const diceSelect = el.querySelector<HTMLSelectElement>('#damageDice')!;
    const stressInput = el.querySelector<HTMLInputElement>('#stressMax')!;
    expect(evasionInput.value).toBe('10');
    expect(rangeSelect.value).toBe('MELEE');
    expect(diceSelect.value).toBe('D6');
    expect(stressInput.value).toBe('3');
  });

  it('emits an incomplete draft as-is -- completeness is decided by the parent at submit time', () => {
    toggleOn();
    setInput('name', 'Rufus');

    expect(host.lastDraft?.payload.name).toBe('Rufus');
    expect(host.lastDraft?.payload.attackName).toBe('');
  });

  it('emits the full payload once required fields are filled in', () => {
    toggleOn();
    setInput('name', 'Rufus');
    setInput('attackName', 'Bite');

    expect(host.lastDraft?.payload).toEqual({
      name: 'Rufus',
      description: undefined,
      evasion: 10,
      attackName: 'Bite',
      attackRange: 'MELEE',
      damageDice: 'D6',
      stressMax: 3,
    });
  });

  it('starts with two empty, fixed-+2 experience rows and reports them on change', () => {
    toggleOn();

    const expInputs = el.querySelectorAll<HTMLInputElement>('.companion-experience-row input');
    expect(expInputs.length).toBe(2);
    expect(host.lastDraft?.experiences).toEqual([
      { name: '', modifier: 2 },
      { name: '', modifier: 2 },
    ]);

    expInputs[0].value = 'Tracker';
    expInputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.lastDraft?.experiences).toEqual([
      { name: 'Tracker', modifier: 2 },
      { name: '', modifier: 2 },
    ]);
  });

  it('never lets the Experience modifier be anything other than +2, however the name is edited', () => {
    toggleOn();

    const expInputs = el.querySelectorAll<HTMLInputElement>('.companion-experience-row input');
    expInputs[0].value = 'Tracker';
    expInputs[0].dispatchEvent(new Event('input'));
    expInputs[1].value = 'Loyal Guardian';
    expInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.lastDraft?.experiences.every(exp => exp.modifier === 2)).toBe(true);
  });

  it('shows the fixed +2 badge next to each experience row, not an editable modifier', () => {
    toggleOn();

    const badges = el.querySelectorAll('.companion-experience-modifier');
    expect(badges.length).toBe(2);
    badges.forEach(badge => expect(badge.textContent?.trim()).toBe('+2'));
  });

  it('restores a previously-entered draft, including an incomplete one, via initialDraft', () => {
    const restoredFixture = TestBed.createComponent(TestHost);
    const restoredEl = restoredFixture.nativeElement as HTMLElement;
    restoredFixture.componentInstance.initialDraft.set({
      payload: {
        name: 'Rufus',
        description: undefined,
        evasion: 10,
        attackName: '',
        attackRange: 'MELEE',
        damageDice: 'D6',
        stressMax: 3,
      },
      experiences: [{ name: 'Tracker', modifier: 2 }, { name: '', modifier: 2 }],
    });
    restoredFixture.detectChanges();

    expect(restoredEl.querySelector('.companion-sheet')).toBeTruthy();
    const nameInput = restoredEl.querySelector<HTMLInputElement>('#name')!;
    const attackNameInput = restoredEl.querySelector<HTMLInputElement>('#attackName')!;
    expect(nameInput.value).toBe('Rufus');
    expect(attackNameInput.value).toBe('');

    const expInputs = restoredEl.querySelectorAll<HTMLInputElement>('.companion-experience-row input');
    expect(expInputs[0].value).toBe('Tracker');
    expect(expInputs[1].value).toBe('');
  });

  it('rejects disallowed characters in an experience name, same rule as a character\'s own Experiences', () => {
    toggleOn();

    const expInputs = el.querySelectorAll<HTMLInputElement>('.companion-experience-row input');
    expInputs[0].value = 'Tracker!!!';
    expInputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.querySelector('.field-error')?.textContent).toContain('Only letters, numbers, spaces, hyphens');
    expect(host.lastDraft?.experiences[0].name).toBe('Tracker');
  });
});
