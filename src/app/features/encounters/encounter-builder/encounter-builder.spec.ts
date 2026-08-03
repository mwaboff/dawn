import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EncounterBuilder } from './encounter-builder';
import { EncounterService } from '../../../shared/services/encounter.service';
import { AdversaryService } from '../../../shared/services/adversary.service';
import { EnvironmentService } from '../../../shared/services/environment.service';
import { EncounterResponse } from '../../../shared/models/encounter-api.model';
import { AdversaryBrowser } from './components/adversary-browser/adversary-browser';
import { BattlePointMeter } from './components/battle-point-meter/battle-point-meter';

function buildEncounterResponse(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 1,
    name: 'Goblin Ambush',
    isOfficial: false,
    isPublic: false,
    creatorId: 1,
    adversaries: [],
    partySize: 5,
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: 17,
    spentBattlePoints: 0,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function setup(id: string | null): { fixture: ComponentFixture<EncounterBuilder>; component: EncounterBuilder; encounterService: EncounterService; router: Router } {
  TestBed.configureTestingModule({
    imports: [EncounterBuilder],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
    ],
  });
  // AdversaryBrowser and EnvironmentPicker fetch on their own ngOnInit -- stub them so every
  // detectChanges() in this file doesn't leave real, un-flushed HTTP requests behind. Their own
  // specs already cover their fetch behaviour; this file only asserts they render with the right
  // inputs, per .agents/rules/testing.md's "don't duplicate assertions with children".
  vi.spyOn(TestBed.inject(AdversaryService), 'getAdversaries').mockReturnValue(
    of({ adversaries: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
  );
  vi.spyOn(TestBed.inject(EnvironmentService), 'getEnvironmentsPaginated').mockReturnValue(
    of({ cards: [], currentPage: 0, totalPages: 0, totalElements: 0 }),
  );
  const fixture = TestBed.createComponent(EncounterBuilder);
  return {
    fixture,
    component: fixture.componentInstance,
    encounterService: TestBed.inject(EncounterService),
    router: TestBed.inject(Router),
  };
}

describe('EncounterBuilder', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  describe('create mode (no :id)', () => {
    it('does not fetch and starts with an empty roster', () => {
      const { fixture, component, encounterService } = setup(null);
      const spy = vi.spyOn(encounterService, 'getEncounter');

      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
      expect(component.roster()).toEqual([]);
      expect(component.encounterId()).toBeNull();
    });

    it('disables Save while the name is blank', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();

      const saveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.builder__save button');
      expect(saveBtn.disabled).toBe(true);
    });

    it('creates the encounter and navigates to its edit route on save', () => {
      const { fixture, component, encounterService, router } = setup(null);
      fixture.detectChanges();
      const createSpy = vi
        .spyOn(encounterService, 'createEncounter')
        .mockReturnValue(of(buildEncounterResponse({ id: 42 })));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.name.set('Goblin Ambush');
      component.onSave();

      expect(createSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/encounters/42/edit'], { replaceUrl: true });
    });

    it('sets saveError when the create request fails', () => {
      const { fixture, component, encounterService } = setup(null);
      fixture.detectChanges();
      vi.spyOn(encounterService, 'createEncounter').mockReturnValue(throwError(() => new Error('boom')));

      component.name.set('Goblin Ambush');
      component.onSave();

      expect(component.saveError()).toBe(true);
      expect(component.saving()).toBe(false);
    });

    it('adds an adversary to the roster', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();

      component.onAddAdversary({ id: 5, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' });

      expect(component.roster()).toHaveLength(1);
      expect(component.roster()[0].adversaryId).toBe(5);
    });

    it('removes an adversary and recomputes displayOrder', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();
      component.onAddAdversary({ id: 5, name: 'A', tier: 1, adversaryType: 'MINION' });
      component.onAddAdversary({ id: 6, name: 'B', tier: 1, adversaryType: 'MINION' });
      const [first] = component.roster();

      component.onRemoveInstance(first.localId);

      expect(component.roster()).toHaveLength(1);
      expect(component.roster()[0].displayOrder).toBe(0);
    });

    it('passes the roster and party size through to the battle point meter', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();
      component.onAddAdversary({ id: 5, name: 'A', tier: 1, adversaryType: 'MINION' });
      fixture.detectChanges();

      const meter = fixture.debugElement.query(sel => sel.componentInstance instanceof BattlePointMeter).componentInstance as BattlePointMeter;
      expect(meter.instances()).toHaveLength(1);
      expect(meter.partySize()).toBe(component.partySize());
    });

    it('renders the adversary browser', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();
      expect(fixture.debugElement.query(sel => sel.componentInstance instanceof AdversaryBrowser)).toBeTruthy();
    });
  });

  describe('edit mode (:id present)', () => {
    it('loads the encounter and populates state', () => {
      const { fixture, component, encounterService } = setup('7');
      vi.spyOn(encounterService, 'getEncounter').mockReturnValue(of(buildEncounterResponse({ id: 7, name: 'Loaded Fight', partySize: 5 })));

      fixture.detectChanges();

      expect(component.name()).toBe('Loaded Fight');
      expect(component.partySize()).toBe(5);
      expect(component.loading()).toBe(false);
    });

    it('sets loadError when the fetch fails', () => {
      const { fixture, component, encounterService } = setup('7');
      vi.spyOn(encounterService, 'getEncounter').mockReturnValue(throwError(() => new Error('boom')));

      fixture.detectChanges();

      expect(component.loadError()).toBe(true);
    });

    it('updates in place and shows a saved confirmation instead of navigating', () => {
      const { fixture, component, encounterService, router } = setup('7');
      vi.spyOn(encounterService, 'getEncounter').mockReturnValue(of(buildEncounterResponse({ id: 7 })));
      fixture.detectChanges();
      const updateSpy = vi.spyOn(encounterService, 'updateEncounter').mockReturnValue(of(buildEncounterResponse({ id: 7 })));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onSave();

      expect(updateSpy).toHaveBeenCalledWith(7, expect.anything());
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(component.savedRecently()).toBe(true);
    });
  });

  describe('Section collapse', () => {
    it('does not render a collapse toggle for Battle Points -- it stays visible as the centrepiece', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();

      const battlePoints = fixture.nativeElement.querySelector('section[aria-label="Battle Points"]');
      expect(battlePoints.querySelector('.expandable-card__header')).toBeFalsy();
    });

    it('starts with the Roster and Add Adversaries sections expanded', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('#builder-roster-body')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#builder-adversaries-body')).toBeTruthy();
    });

    it('starts with the Environment section collapsed', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();

      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-controls="builder-environment-body"]');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.querySelector('#builder-environment-body')).toBeFalsy();
    });

    // EnvironmentPicker is content projected into CollapsibleSection, and Angular creates
    // projected component instances (and fires their ngOnInit) as part of *this* component's own
    // view -- CollapsibleSection's `@if` around `<ng-content>` only gates DOM insertion, not
    // instantiation. So collapsing the section by default does not defer the fetch; it still
    // fires on load exactly as it did before Environment defaulted to collapsed. Asserted here so
    // this is documented rather than silently assumed.
    it('still fetches environments on load even though the section starts collapsed', () => {
      const { fixture } = setup(null);
      const fetchSpy = vi.spyOn(TestBed.inject(EnvironmentService), 'getEnvironmentsPaginated');

      fixture.detectChanges();

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('expands the Environment section on toggle, revealing the picker', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();

      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-controls="builder-environment-body"]');
      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('#builder-environment-body')).toBeTruthy();
    });

    it('collapses the Roster section on toggle click, flipping aria-expanded and hiding its body', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();

      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-controls="builder-roster-body"]');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.querySelector('#builder-roster-body')).toBeFalsy();
    });

    it('expands a collapsed section again on a second click', () => {
      const { fixture } = setup(null);
      fixture.detectChanges();
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-controls="builder-adversaries-body"]');
      toggle.click();
      fixture.detectChanges();

      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('#builder-adversaries-body')).toBeTruthy();
    });

    it('collapses sections independently of one another', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();

      component.sections.toggle('roster');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('#builder-roster-body')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#builder-environment-body')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#builder-adversaries-body')).toBeTruthy();
    });
  });

  describe('Add-to-roster feedback', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('announces the addition by name and destination', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();

      component.onAddAdversary({ id: 5, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' });
      vi.advanceTimersByTime(50);
      fixture.detectChanges();

      expect(component.addAnnouncement()).toBe('Goblin Scout added to roster');
      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion.textContent.trim()).toBe('Goblin Scout added to roster');
    });

    it('marks the new instance as just-added, then clears it after the feedback window', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();

      component.onAddAdversary({ id: 5, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' });
      const [instance] = component.roster();
      expect(component.justAddedInstanceId()).toBe(instance.localId);

      vi.advanceTimersByTime(1200);

      expect(component.justAddedInstanceId()).toBeNull();
    });

    it('re-expands the Roster section if it was minimized when an adversary is added', () => {
      const { fixture, component } = setup(null);
      fixture.detectChanges();
      component.sections.toggle('roster');
      expect(component.sections.isCollapsed('roster')).toBe(true);

      component.onAddAdversary({ id: 5, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' });

      expect(component.sections.isCollapsed('roster')).toBe(false);
    });
  });
});
