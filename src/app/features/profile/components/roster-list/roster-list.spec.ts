import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RosterList } from './roster-list';
import { CharacterSummary } from '../../models/profile.model';

@Component({
  template: `
    <app-roster-list
      [characters]="characters()"
      [loading]="loading()"
      [error]="error()"
      (viewCharacter)="viewedId = $event"
      (createCharacter)="createCalled = true"
    />
  `,
  imports: [RosterList],
})
class TestHost {
  characters = signal<CharacterSummary[]>([]);
  loading = signal(false);
  error = signal(false);
  viewedId: number | null = null;
  createCalled = false;
}

function makeCharacter(overrides: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    id: 1,
    name: 'Aragorn',
    level: 5,
    classEntries: [],
    createdAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

describe('RosterList', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-roster-list')).toBeTruthy();
  });

  it('should show loading skeletons when loading is true', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-skeleton').length).toBe(3);
  });

  it('should show error message when error is true', () => {
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.roster-message')).toBeTruthy();
  });

  it('should show empty state when characters is empty', () => {
    fixture.detectChanges();

    expect(el.querySelector('.roster-empty')).toBeTruthy();
  });

  it('should show empty state text', () => {
    fixture.detectChanges();

    expect(el.querySelector('.roster-empty-text')?.textContent?.trim()).toBe('Your story awaits');
  });

  it('should emit createCharacter when create button is clicked', () => {
    fixture.detectChanges();
    const btn = el.querySelector('.roster-create-btn') as HTMLButtonElement;
    btn.click();

    expect(host.createCalled).toBe(true);
  });

  it('should render character entries', () => {
    host.characters.set([
      makeCharacter({ id: 1, name: 'Aragorn', level: 5 }),
      makeCharacter({ id: 2, name: 'Lyra', level: 3 }),
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-entry').length).toBe(2);
  });

  it('should display character name', () => {
    host.characters.set([makeCharacter({ name: 'Kael' })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-character-name')?.textContent?.trim()).toBe('Kael');
  });

  it('should display character level', () => {
    host.characters.set([makeCharacter({ level: 7 })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-level')?.textContent?.trim()).toBe('7');
  });

  it('should display pronouns when present', () => {
    host.characters.set([makeCharacter({ pronouns: 'she/her' })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-pronouns')?.textContent?.trim()).toBe('she/her');
  });

  it('should not display pronouns when absent', () => {
    host.characters.set([makeCharacter({ pronouns: undefined })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-pronouns')).toBeFalsy();
  });

  it('should emit viewCharacter with id when entry is clicked', () => {
    host.characters.set([makeCharacter({ id: 42 })]);
    fixture.detectChanges();
    const entry = el.querySelector('.roster-entry') as HTMLElement;
    entry.click();

    expect(host.viewedId).toBe(42);
  });

  it('should display class and subclass', () => {
    host.characters.set([
      makeCharacter({
        classEntries: [{ className: 'Guardian', subclassName: 'Stalwart' }],
      }),
    ]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-class-name')?.textContent?.trim()).toBe('Guardian');
    expect(el.querySelector('.roster-class-subclass')?.textContent?.trim()).toBe('Stalwart');
  });

  it('should display class without subclass when subclassName is absent', () => {
    host.characters.set([
      makeCharacter({
        classEntries: [{ className: 'Ranger' }],
      }),
    ]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-class-name')?.textContent?.trim()).toBe('Ranger');
    expect(el.querySelector('.roster-class-subclass')).toBeFalsy();
  });

  it('should not display class row when classEntries is empty', () => {
    host.characters.set([makeCharacter({ classEntries: [] })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-class')).toBeFalsy();
  });

  it('should display multiple class entries', () => {
    host.characters.set([
      makeCharacter({
        classEntries: [
          { className: 'Guardian', subclassName: 'Stalwart' },
          { className: 'Sorcerer', subclassName: 'Elementalist' },
        ],
      }),
    ]);
    fixture.detectChanges();

    const entries = el.querySelectorAll('.roster-class-entry');
    expect(entries.length).toBe(2);
  });

  it('should show new character link when characters exist', () => {
    host.characters.set([makeCharacter()]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-add-link')).toBeTruthy();
  });
});
