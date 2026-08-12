import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreatureComfortChange, RestCreatureComfort } from './rest-creature-comfort';
import { CreatureComfortChoices, RestCompanionState, RestType } from '../../models/rest.model';

function companion(overrides: Partial<RestCompanionState> = {}): RestCompanionState {
  return { id: 1, name: 'Rex', stressMarked: 0, stressMax: 3, hasCreatureComfort: true, ...overrides };
}

@Component({
  imports: [RestCreatureComfort],
  template: `<app-rest-creature-comfort
    [companions]="companions()"
    [choices]="choices()"
    [restType]="restType()"
    (choiceChanged)="onChange($event)"
  />`,
})
class TestHost {
  companions = signal<readonly RestCompanionState[]>([companion()]);
  choices = signal<CreatureComfortChoices>({});
  restType = signal<RestType>('short');
  changes: CreatureComfortChange[] = [];

  onChange(change: CreatureComfortChange): void {
    this.changes.push(change);
  }
}

describe('RestCreatureComfort', () => {
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

  function radios(): HTMLInputElement[] {
    return [...el.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  }

  it('offers one group per companion', () => {
    host.companions.set([companion(), companion({ id: 2, name: 'Mote' })]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.rest-comfort__group').length).toBe(2);
  });

  it('names the companion in its group legend', () => {
    expect(el.querySelector('.rest-comfort__legend')?.textContent).toContain('Rex');
  });

  it('offers the two rules choices plus opting out', () => {
    expect(radios().length).toBe(3);
    expect(el.textContent).toContain('Gain a Hope');
    expect(el.textContent).toContain('You both clear a Stress');
  });

  it('starts on "don’t use it" when nothing has been chosen', () => {
    expect(radios()[0].checked).toBe(true);
  });

  it('reflects an existing choice', () => {
    host.choices.set({ 1: 'hope' });
    fixture.detectChanges();

    expect(radios()[1].checked).toBe(true);
  });

  it('emits the choice when one is picked', () => {
    radios()[2].click();
    fixture.detectChanges();

    expect(host.changes).toEqual([{ companionId: 1, choice: 'stress' }]);
  });

  it('emits a null choice when opting back out', () => {
    host.choices.set({ 1: 'hope' });
    fixture.detectChanges();
    radios()[0].click();

    expect(host.changes).toEqual([{ companionId: 1, choice: null }]);
  });

  /** Two companions must not share a radio group, or choosing for one clears the other. */
  it('keeps each companion’s radios in their own group', () => {
    host.companions.set([companion(), companion({ id: 2, name: 'Mote' })]);
    fixture.detectChanges();

    const names = new Set(radios().map(radio => radio.name));
    expect(names.size).toBe(2);
  });

  it('notes that a long rest is bringing a downed companion back', () => {
    host.companions.set([companion({ stressMarked: 3, stressMax: 3 })]);
    host.restType.set('long');
    fixture.detectChanges();

    expect(el.querySelector('.rest-comfort__note')?.textContent).toContain('out of the scene');
  });

  it('adds no such note for a companion that is already present', () => {
    host.restType.set('long');
    fixture.detectChanges();

    expect(el.querySelector('.rest-comfort__note')).toBeFalsy();
  });
});
