import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EncounterBuilder } from './encounter-builder';
import { EncounterService } from '../../../shared/services/encounter.service';
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
});
