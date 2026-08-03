import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

import { AdversaryBrowser } from './adversary-browser';
import { AdversaryCard } from '../../../../../shared/components/adversary-card/adversary-card';
import { AdversaryService } from '../../../../../shared/services/adversary.service';
import { AdversaryData } from '../../../../../shared/components/adversary-card/adversary-card.model';
import { of, throwError } from 'rxjs';

function buildAdversary(overrides: Partial<AdversaryData> = {}): AdversaryData {
  return { id: 1, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION', ...overrides };
}

describe('AdversaryBrowser', () => {
  let fixture: ComponentFixture<AdversaryBrowser>;
  let component: AdversaryBrowser;
  let adversaryService: AdversaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdversaryBrowser],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AdversaryBrowser);
    component = fixture.componentInstance;
    adversaryService = TestBed.inject(AdversaryService);
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('loads adversaries on init', () => {
    const spy = vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [buildAdversary()], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );

    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
    expect(component.adversaries()).toHaveLength(1);
    expect(component.loading()).toBe(false);
  });

  it('sets error and clears loading when the request fails', () => {
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('renders one card per adversary with an aria-labelled Add button', () => {
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [buildAdversary({ name: 'Orc Warrior' })], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );

    fixture.detectChanges();

    const addBtn = fixture.nativeElement.querySelector('.browser__add-btn');
    expect(addBtn.getAttribute('aria-label')).toBe('Add Orc Warrior to the encounter');
  });

  it('emits adversaryAdded when the Add button is clicked', () => {
    const adversary = buildAdversary({ name: 'Orc Warrior' });
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [adversary], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );
    const emitted: AdversaryData[] = [];
    component.adversaryAdded.subscribe(a => emitted.push(a));

    fixture.detectChanges();
    fixture.nativeElement.querySelector('.browser__add-btn').click();

    expect(emitted).toEqual([adversary]);
  });

  it('toggling a tier filters by that tier and resets to page 0', () => {
    const spy = vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
    );
    fixture.detectChanges();
    component.page.set(2);

    component.toggleTier(2);

    expect(component.isTierSelected(2)).toBe(true);
    expect(component.page()).toBe(0);
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ tier: [2] }));
  });

  it('toggling the same tier twice clears it', () => {
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
    );
    fixture.detectChanges();

    component.toggleTier(3);
    component.toggleTier(3);

    expect(component.isTierSelected(3)).toBe(false);
  });

  it('supports selecting multiple tiers at once', () => {
    const spy = vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
    );
    fixture.detectChanges();

    component.toggleTier(1);
    component.toggleTier(2);

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ tier: [1, 2] }));
  });

  it('changing the type select filters by that type', () => {
    const spy = vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
    );
    fixture.detectChanges();

    component.onTypeChange({ target: { value: 'SOLO' } } as unknown as Event);

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ adversaryType: 'SOLO' }));
  });

  it('shows the empty state when no adversaries match', () => {
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.browser__empty')).toBeTruthy();
  });

  it('changing the page requests that page', () => {
    const spy = vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [buildAdversary()], currentPage: 0, totalPages: 3, totalElements: 30 }),
    );
    fixture.detectChanges();

    component.onPageChange(1);

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('uses the shared themed select for the type filter', () => {
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.browser__type-select').classList.contains('form-select')).toBe(true);
  });

  it('renders each catalog card as whole-card collapsible, so a long page stays scannable', () => {
    vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
      of({ adversaries: [buildAdversary()], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );
    fixture.detectChanges();

    const card = fixture.debugElement.query(sel => sel.componentInstance instanceof AdversaryCard).componentInstance as AdversaryCard;
    expect(card.collapsible()).toBe(true);
  });

  describe('Add feedback', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('flips the Add button to a checkmark after it is clicked', () => {
      const adversary = buildAdversary({ name: 'Orc Warrior' });
      vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
        of({ adversaries: [adversary], currentPage: 0, totalPages: 1, totalElements: 1 }),
      );
      fixture.detectChanges();

      const addBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.browser__add-btn');
      addBtn.click();
      fixture.detectChanges();

      expect(addBtn.classList.contains('browser__add-btn--added')).toBe(true);
    });

    it('reverts the Add button back to its default state after the flash window', () => {
      const adversary = buildAdversary({ name: 'Orc Warrior' });
      vi.spyOn(adversaryService, 'getAdversaries').mockReturnValue(
        of({ adversaries: [adversary], currentPage: 0, totalPages: 1, totalElements: 1 }),
      );
      fixture.detectChanges();

      const addBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.browser__add-btn');
      addBtn.click();
      vi.advanceTimersByTime(1200);
      fixture.detectChanges();

      expect(addBtn.classList.contains('browser__add-btn--added')).toBe(false);
    });
  });
});
