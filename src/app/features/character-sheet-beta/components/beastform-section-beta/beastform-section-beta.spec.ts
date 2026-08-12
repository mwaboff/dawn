import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { BeastformSectionBeta } from './beastform-section-beta';
import { BeastformSection } from '../../../character-sheet/components/beastform-section/beastform-section';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { PaginatedResponse } from '../../../../shared/models/api.model';
import { BeastformResponse } from '../../../../shared/models/beastform-api.model';

function buildBeastform(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
  return {
    id: 1,
    name: 'Agile Scout',
    tier: 1,
    advantages: 'climb, locate, protect',
    agilityModifier: 1,
    evasion: 2,
    attackRange: 'MELEE',
    attackTrait: 'AGILITY',
    damage: { diceType: 'D4', damageType: 'PHYSICAL' },
    expansionId: 1,
    isOfficial: true,
    isPublic: true,
    features: [{ id: 5, name: 'Keen Senses', description: 'You notice things others miss.' }],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Mirrors `buildStatlessBeastform` in beastform-section.spec.ts -- the "Evolved" meta-cards print
 * no stat line at all: no evasion, trait modifiers, attack range/trait, or damage. */
function buildStatlessBeastform(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
  return {
    id: 17,
    name: 'Legendary Beast',
    tier: 3,
    expansionId: 1,
    isOfficial: true,
    isPublic: true,
    features: [{ id: 777, name: 'Evolved', description: 'Pick a Tier 1 Beastform option.' }],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPage(content: BeastformResponse[]): PaginatedResponse<BeastformResponse> {
  return { content, currentPage: 0, pageSize: 100, totalElements: content.length, totalPages: 1 };
}

function entityCardOf(fixture: ComponentFixture<BeastformSectionBeta>): EntityCard {
  return fixture.debugElement.query(By.directive(EntityCard)).componentInstance as EntityCard;
}

describe('BeastformSectionBeta', () => {
  let fixture: ComponentFixture<BeastformSectionBeta>;
  let component: BeastformSectionBeta;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/beastforms';

  function setUpAndFlush(level: number, forms: BeastformResponse[]): void {
    fixture = TestBed.createComponent(BeastformSectionBeta);
    fixture.componentRef.setInput('characterLevel', level);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.toggleSection();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === baseUrl).flush(buildPage(forms));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BeastformSectionBeta],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('inherits BeastformSection, reusing its tier filtering and lazy-load pipeline unchanged', () => {
    setUpAndFlush(4, [
      buildBeastform({ id: 1, name: 'Agile Scout', tier: 1 }),
      buildBeastform({ id: 2, name: 'Great Predator', tier: 3 }),
    ]);

    expect(component).toBeInstanceOf(BeastformSection);
    expect(component.beastforms().map(f => f.name)).toEqual(['Agile Scout']);
  });

  describe('mapping a beastform onto EntityCardData', () => {
    it('renders one EntityCard per accessible beastform', () => {
      setUpAndFlush(2, [
        buildBeastform({ id: 1, name: 'Agile Scout', tier: 1 }),
        buildBeastform({ id: 2, name: 'Armored Sentry', tier: 2 }),
      ]);

      const cards = fixture.debugElement.queryAll(By.directive(EntityCard));

      expect(cards.length).toBe(2);
    });

    it('maps statLine to headline, tier to a badge, attackLine to a meta row, and advantages/features into the feature list', () => {
      setUpAndFlush(1, [buildBeastform()]);

      const card = entityCardOf(fixture).card();

      expect(card.id).toBe(1);
      expect(card.name).toBe('Agile Scout');
      expect(card.cardType).toBe('beastform');
      expect(card.headline).toBe('Agility +1 · Ev +2 · d4 phy');
      expect(card.badges).toEqual([{ label: 'Tier', value: '1' }]);
      expect(card.meta).toEqual([{ label: 'Attack', value: 'Melee · Agility · d4 phy' }]);
      expect(card.features).toEqual([
        { name: 'Gain advantage on', description: 'climb, locate, protect' },
        { name: 'Keen Senses', description: 'You notice things others miss.' },
      ]);
    });

    it('omits the headline and meta row for a stat-less form, without printing "undefined"', () => {
      setUpAndFlush(5, [buildStatlessBeastform()]);

      const card = entityCardOf(fixture).card();

      expect(card.headline).toBeUndefined();
      expect(card.meta).toBeUndefined();
      expect(card.features).toEqual([{ name: 'Evolved', description: 'Pick a Tier 1 Beastform option.' }]);
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('undefined');
    });

    it('leaves stats unset, because the view model only exposes the pre-joined stat line', () => {
      setUpAndFlush(1, [buildBeastform()]);

      const card = entityCardOf(fixture).card();

      expect(card.stats).toBeUndefined();
    });

    it('omits the advantages feature entirely when the form grants none', () => {
      setUpAndFlush(1, [buildBeastform({ advantages: undefined })]);

      const card = entityCardOf(fixture).card();

      expect(card.features).toEqual([{ name: 'Keen Senses', description: 'You notice things others miss.' }]);
    });
  });

  describe('per-card disclosure, wired to the inherited toggleForm/isFormExpanded', () => {
    it('starts every card at normal size', () => {
      setUpAndFlush(1, [buildBeastform()]);

      expect(entityCardOf(fixture).size()).toBe('normal');
    });

    it('flips the inherited isFormExpanded state when the card emits sizeChange', () => {
      setUpAndFlush(1, [buildBeastform()]);

      fixture.debugElement.query(By.directive(EntityCard)).triggerEventHandler('sizeChange', 'expanded');

      expect(component.isFormExpanded(1)).toBe(true);
    });

    it('forces the card back to normal size once isFormExpanded flips back on a second toggle', () => {
      setUpAndFlush(1, [buildBeastform()]);
      const cardDebugEl = fixture.debugElement.query(By.directive(EntityCard));

      cardDebugEl.triggerEventHandler('sizeChange', 'expanded');
      fixture.detectChanges();
      cardDebugEl.triggerEventHandler('sizeChange', 'normal');
      fixture.detectChanges();

      expect(component.isFormExpanded(1)).toBe(false);
      expect((cardDebugEl.componentInstance as EntityCard).size()).toBe('normal');
    });
  });

  it('projects no controls or actions -- a beastform card has no interactive content beyond its own built-in disclosure toggle', () => {
    setUpAndFlush(1, [buildBeastform()]);

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('[card-controls]').length).toBe(0);
    expect(host.querySelectorAll('[card-actions]').length).toBe(0);
  });

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    function buildRestrictedBeastform(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
      return {
        id: 9,
        name: 'ignored',
        expansionId: 2,
        isOfficial: false,
        isPublic: false,
        createdAt: '',
        lastModifiedAt: '',
        restricted: true,
        ...overrides,
      };
    }

    it('maps to the locked 2-field card and lets EntityCard draw the locked face itself', () => {
      setUpAndFlush(1, [buildRestrictedBeastform({ expansionName: 'Hope & Fear' })]);

      const card = entityCardOf(fixture).card();

      expect(card.restricted).toBe(true);
      expect(card.expansionName).toBe('Hope & Fear');
      expect(card.name).toBeUndefined();
      expect(card.badges).toBeUndefined();
      expect(card.headline).toBeUndefined();
      expect(card.meta).toBeUndefined();
      expect(card.features).toBeUndefined();
    });

    it('does not throw sorting a mix of restricted and normal beastforms', () => {
      expect(() => setUpAndFlush(1, [buildRestrictedBeastform(), buildBeastform()])).not.toThrow();
    });

    it('renders the shared locked face through EntityCard, with no fabricated Tier badge', () => {
      setUpAndFlush(1, [buildRestrictedBeastform({ expansionName: 'Hope & Fear' })]);

      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('.entity-card__locked')).toBeTruthy();
      expect(host.querySelector('.entity-card__badges')).toBeFalsy();
      expect(host.textContent).toContain('Hope & Fear');
    });
  });

  it("points the header's aria-controls at the id actually rendered on the section body", () => {
    setUpAndFlush(1, [buildBeastform()]);

    const host = fixture.nativeElement as HTMLElement;
    const header = host.querySelector('.expandable-card__header')!;
    const body = host.querySelector('.expandable-card__body')!;

    expect(body.id).toBeTruthy();
    expect(header.getAttribute('aria-controls')).toBe(body.id);
  });
});
