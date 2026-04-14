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
      [showCreateButton]="showCreateButton()"
      [canDelete]="canDelete()"
      (viewCharacter)="viewedId = $event"
      (createCharacter)="createCalled = true"
      (deleteCharacter)="deletedId = $event"
    />
  `,
  imports: [RosterList],
})
class TestHost {
  characters = signal<CharacterSummary[]>([]);
  loading = signal(false);
  error = signal(false);
  showCreateButton = signal(true);
  canDelete = signal(false);
  viewedId: number | null = null;
  deletedId: number | null = null;
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

  it('should show create button when showCreateButton is true (default)', () => {
    fixture.detectChanges();

    expect(el.querySelector('.roster-create-btn')).toBeTruthy();
  });

  it('should hide create button when showCreateButton is false', () => {
    host.showCreateButton.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.roster-create-btn')).toBeFalsy();
  });

  it('should show "No characters yet" text when showCreateButton is false and empty', () => {
    host.showCreateButton.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.roster-empty-text')?.textContent?.trim()).toBe('No characters yet');
  });

  it('should hide new character link when showCreateButton is false and characters exist', () => {
    host.showCreateButton.set(false);
    host.characters.set([makeCharacter()]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-add-link')).toBeFalsy();
  });

  describe('delete functionality', () => {
    it('should not show delete button when canDelete is false', () => {
      host.characters.set([makeCharacter()]);
      fixture.detectChanges();

      expect(el.querySelector('.roster-delete-btn')).toBeFalsy();
    });

    it('should show delete button when canDelete is true', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter()]);
      fixture.detectChanges();

      expect(el.querySelector('.roster-delete-btn')).toBeTruthy();
    });

    it('should show inline confirm when delete button is clicked', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter({ id: 42 })]);
      fixture.detectChanges();

      const btn = el.querySelector('.roster-delete-btn') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(el.querySelector('.roster-inline-confirm')).toBeTruthy();
      expect(el.querySelector('.roster-inline-confirm-text')?.textContent?.trim()).toBe('Delete?');
    });

    it('should not navigate when delete button is clicked', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter({ id: 42 })]);
      fixture.detectChanges();

      const btn = el.querySelector('.roster-delete-btn') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(host.viewedId).toBeNull();
    });

    it('should hide inline confirm when No is clicked', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter({ id: 42 })]);
      fixture.detectChanges();

      (el.querySelector('.roster-delete-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el.querySelector('.roster-inline-confirm')).toBeTruthy();

      (el.querySelector('.roster-inline-cancel-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el.querySelector('.roster-inline-confirm')).toBeFalsy();
      expect(el.querySelector('.roster-delete-btn')).toBeTruthy();
    });

    it('should show confirm dialog when inline Yes is clicked', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter({ id: 42 })]);
      fixture.detectChanges();

      (el.querySelector('.roster-delete-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      (el.querySelector('.roster-inline-confirm-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el.querySelector('app-confirm-dialog')).toBeTruthy();
    });

    it('should emit deleteCharacter on modal confirm', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter({ id: 42 })]);
      fixture.detectChanges();

      (el.querySelector('.roster-delete-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      (el.querySelector('.roster-inline-confirm-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      (el.querySelector('.dialog-btn--confirm') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(host.deletedId).toBe(42);
    });

    it('should hide dialog and inline confirm on modal cancel', () => {
      host.canDelete.set(true);
      host.characters.set([makeCharacter({ id: 42 })]);
      fixture.detectChanges();

      (el.querySelector('.roster-delete-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      (el.querySelector('.roster-inline-confirm-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el.querySelector('app-confirm-dialog')).toBeTruthy();

      (el.querySelector('.dialog-btn--cancel') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el.querySelector('app-confirm-dialog')).toBeFalsy();
      expect(el.querySelector('.roster-inline-confirm')).toBeFalsy();
    });
  });
});
