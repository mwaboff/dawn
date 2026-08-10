import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ResultCard } from './result-card';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  template: `<app-result-card [result]="result" />`,
  imports: [ResultCard],
})
class HostComponent {
  result!: MappedSearchResult;
}

const CARD_RESULT: MappedSearchResult = {
  type: 'WEAPON',
  id: 4,
  name: 'Longsword',
  relevanceScore: 8,
  card: { id: 4, name: 'Longsword', description: 'A fine blade.', cardType: 'class' },
};

const ADVERSARY_RESULT: MappedSearchResult = {
  type: 'ADVERSARY',
  id: 9,
  name: 'Goblin',
  relevanceScore: 5,
  adversary: { id: 9, name: 'Goblin', tier: 1, adversaryType: 'STANDARD' },
};

function setup(): { fixture: ComponentFixture<HostComponent>; host: HostComponent } {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  return { fixture, host };
}

describe('ResultCard', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-card-theme');
  });

  describe('classic layout (default)', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(() => {
      ({ fixture, host } = setup());
    });

    it('renders a DaggerheartCard for a card result, at wide layout with collapsible features', () => {
      host.result = CARD_RESULT;
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('app-daggerheart-card');
      expect(card).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-entity-card')).toBeNull();
    });

    it('renders an AdversaryCard for an adversary result', () => {
      host.result = ADVERSARY_RESULT;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-adversary-card')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-daggerheart-card')).toBeNull();
    });

    it('renders nothing for a result with neither card nor adversary', () => {
      host.result = { type: 'FEATURE', id: 1, name: 'Blade Dance', relevanceScore: 1 };
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-daggerheart-card')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-adversary-card')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-entity-card')).toBeNull();
    });

    it('renders the customize action as its default classic (text-button) variant, unchanged', () => {
      vi.spyOn(TestBed.inject(AuthService), 'isLoggedIn').mockReturnValue(true);
      host.result = CARD_RESULT;
      fixture.detectChanges();

      const action = fixture.nativeElement.querySelector('app-customize-item-action');
      expect(action).toBeTruthy();
      expect(action.querySelector('button')?.textContent?.trim()).toBe('Customize this item');
    });
  });

  describe('beta layout', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(() => {
      ({ fixture, host } = setup());
      TestBed.inject(PreferencesService).setSheetLayout('beta');
    });

    it('renders an EntityCard instead of a DaggerheartCard for a card result', () => {
      host.result = CARD_RESULT;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-entity-card')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-daggerheart-card')).toBeNull();
    });

    it('maps the card through cardDataToEntityCard so the entity card gets the same name', () => {
      host.result = CARD_RESULT;
      fixture.detectChanges();

      const entityCardEl = fixture.nativeElement.querySelector('app-entity-card');
      expect(entityCardEl.textContent).toContain('Longsword');
    });

    it('renders the EntityCard at size="expanded"', () => {
      host.result = CARD_RESULT;
      fixture.detectChanges();

      const entityCard = fixture.debugElement.query(
        (de) => de.name === 'app-entity-card',
      );
      expect(entityCard.componentInstance.displaySize()).toBe('expanded');
    });

    it('scopes the entity card to a dark-capable card surface', () => {
      host.result = CARD_RESULT;
      fixture.detectChanges();

      const surface = fixture.nativeElement.querySelector('[data-card-theme]');
      expect(surface).toBeTruthy();
      expect(surface.querySelector('app-entity-card')).toBeTruthy();
    });

    it('renders an EntityCard instead of AdversaryCard for an adversary result', () => {
      host.result = ADVERSARY_RESULT;
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('app-entity-card');
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('Goblin');
      expect(fixture.nativeElement.querySelector('app-adversary-card')).toBeNull();
    });

    it('renders the adversary EntityCard at size="expanded", matching the read-everything browse intent', () => {
      host.result = ADVERSARY_RESULT;
      fixture.detectChanges();

      const entityCard = fixture.debugElement.query(
        (de) => de.name === 'app-entity-card',
      );
      expect(entityCard.componentInstance.displaySize()).toBe('expanded');
    });

    it('scopes the adversary card to a dark-capable card surface', () => {
      host.result = ADVERSARY_RESULT;
      fixture.detectChanges();

      const surface = fixture.nativeElement.querySelector('[data-card-theme]');
      expect(surface).toBeTruthy();
      expect(surface.querySelector('app-entity-card')).toBeTruthy();
    });

    it('offers no Select/choose affordance on the beta adversary face -- reference is read-only browse', () => {
      host.result = ADVERSARY_RESULT;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.entity-select')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Select');
    });

    it('projects the customize action into the EntityCard card-controls slot', () => {
      vi.spyOn(TestBed.inject(AuthService), 'isLoggedIn').mockReturnValue(true);
      host.result = CARD_RESULT;
      fixture.detectChanges();

      const controls = fixture.nativeElement.querySelector('[card-controls]');
      expect(controls?.querySelector('app-customize-item-action button')).toBeTruthy();
    });
  });
});
