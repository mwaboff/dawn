import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import {
  CompanionExperienceRows,
  emptyCompanionExperienceNames,
  STARTING_COMPANION_EXPERIENCE_COUNT,
} from './companion-experience-rows';

@Component({
  imports: [CompanionExperienceRows],
  template: `
    <app-companion-experience-rows [names]="names()" (namesChanged)="onNamesChanged($event)" />
  `,
})
class TestHost {
  names = signal<string[]>(emptyCompanionExperienceNames());
  lastEmitted: string[] | undefined;

  onNamesChanged(names: string[]): void {
    this.lastEmitted = names;
    this.names.set(names);
  }
}

describe('CompanionExperienceRows', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  const inputs = () => el.querySelectorAll<HTMLInputElement>('.companion-experience-row input');

  const type = (index: number, value: string) => {
    const input = inputs()[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders one row per name', () => {
    expect(inputs().length).toBe(STARTING_COMPANION_EXPERIENCE_COUNT);
  });

  it('renders the modifier as fixed text rather than an editable control', () => {
    const badges = el.querySelectorAll('.companion-experience-modifier');

    expect(Array.from(badges).every(b => b.textContent?.trim() === '+2')).toBe(true);
  });

  it('emits the full name list with only the edited row changed', () => {
    type(0, 'Tracker');

    expect(host.lastEmitted).toEqual(['Tracker', '']);
  });

  it('leaves the other rows untouched when a later row is edited', () => {
    type(0, 'Tracker');
    type(1, 'Loyal Guardian');

    expect(host.lastEmitted).toEqual(['Tracker', 'Loyal Guardian']);
  });

  it('strips disallowed characters from a typed name', () => {
    type(0, 'Tracker!!');

    expect(host.lastEmitted?.[0]).toBe('Tracker');
  });

  it('shows an error when the typed name had disallowed characters', () => {
    type(0, 'Tracker!!');

    expect(el.querySelector('.field-error')?.textContent).toContain('Only letters, numbers');
  });

  it('clears the error once the name is valid again', () => {
    type(0, 'Tracker!!');
    type(0, 'Tracker');

    expect(el.querySelector('.field-error')).toBeFalsy();
  });

  it('renders no error for an allowed name', () => {
    type(0, "Ma'ren-Vex 2");

    expect(el.querySelector('.field-error')).toBeFalsy();
  });
});
