import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BeastformSection } from './beastform-section';
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
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * The "Evolved" meta-cards (Legendary Beast tier 3, Mythic Beast tier 4) print no stat line at
 * all: evasion, every trait modifier, attackRange, attackTrait and damage are absent. Rendering
 * them must show only the feature text -- never "undefined" and never a throw.
 */
function buildStatlessBeastform(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
  return {
    id: 17,
    name: 'Legendary Beast',
    example: 'Upgraded Tier 1 Options',
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

describe('BeastformSection', () => {
  let fixture: ComponentFixture<BeastformSection>;
  let component: BeastformSection;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/beastforms';

  function setUp(level: number): void {
    fixture = TestBed.createComponent(BeastformSection);
    fixture.componentRef.setInput('characterLevel', level);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function setUpAndFlush(level: number, forms: BeastformResponse[]): void {
    setUp(level);
    component.toggleSection();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === baseUrl).flush(buildPage(forms));
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BeastformSection],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    setUp(1);

    expect(component).toBeTruthy();
  });

  describe('tier derivation from character level', () => {
    const cases: [number, number][] = [[1, 1], [4, 2], [5, 3], [7, 3], [8, 4], [10, 4]];

    for (const [level, expectedTier] of cases) {
      it(`should compute tier ${expectedTier} for level ${level}`, () => {
        setUp(level);

        expect(component.tier()).toBe(expectedTier);
      });
    }
  });

  describe('lazy loading', () => {
    it('should issue no HTTP request before the options card is expanded', () => {
      setUp(5);

      httpTesting.expectNone(() => true);
    });

    it('should fetch the catalog on first expand', () => {
      setUp(5);

      component.toggleSection();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(buildPage([]));
    });

    it('should request a page large enough for the whole catalog with the features expand', () => {
      setUp(5);

      component.toggleSection();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.params.get('size')).toBe('100');
      expect(req.request.params.get('expand')).toBe('features');
      req.flush(buildPage([]));
    });

    it('should not refetch when the options card is collapsed and expanded again', () => {
      setUpAndFlush(5, [buildBeastform()]);

      component.toggleSection();
      component.toggleSection();

      httpTesting.expectNone(() => true);
    });
  });

  describe('tier filtering', () => {
    it('should list only forms at or below the character tier', () => {
      setUpAndFlush(4, [
        buildBeastform({ id: 1, name: 'Agile Scout', tier: 1 }),
        buildBeastform({ id: 2, name: 'Armored Sentry', tier: 2 }),
        buildBeastform({ id: 3, name: 'Great Predator', tier: 3 }),
      ]);

      expect(component.beastforms().map(f => f.name)).toEqual([
        'Agile Scout',
        'Armored Sentry',
      ]);
    });

    it('should report the accessible count, not the catalog size', () => {
      setUpAndFlush(1, [
        buildBeastform({ id: 1, tier: 1 }),
        buildBeastform({ id: 2, tier: 2 }),
        buildBeastform({ id: 3, tier: 4 }),
      ]);

      expect(component.availableCount()).toBe(1);
    });

    it('should order forms by tier ascending', () => {
      setUpAndFlush(10, [
        buildBeastform({ id: 3, tier: 3 }),
        buildBeastform({ id: 1, tier: 1 }),
        buildBeastform({ id: 2, tier: 2 }),
      ]);

      expect(component.beastforms().map(f => f.tier)).toEqual([1, 2, 3]);
    });

    it('should order forms alphabetically within a tier', () => {
      setUpAndFlush(10, [
        buildBeastform({ id: 2, name: 'Zealous Guardian', tier: 1 }),
        buildBeastform({ id: 1, name: 'Agile Scout', tier: 1 }),
      ]);

      expect(component.beastforms().map(f => f.name)).toEqual(['Agile Scout', 'Zealous Guardian']);
    });

    it('should exclude forms that carry no tier at all', () => {
      setUpAndFlush(10, [buildBeastform({ id: 9, name: 'Untiered', tier: undefined })]);

      expect(component.availableCount()).toBe(0);
    });
  });

  describe('stat line', () => {
    it('should combine trait bonus, evasion and damage', () => {
      setUpAndFlush(1, [buildBeastform()]);

      expect(component.beastforms()[0].statLine).toBe('Agility +1 · Ev +2 · d4 phy');
    });

    it('should prefer the server-provided damage notation when present', () => {
      setUpAndFlush(1, [
        buildBeastform({ damage: { diceType: 'D6', damageType: 'PHYSICAL', notation: '1d6 phy' } }),
      ]);

      expect(component.beastforms()[0].statLine).toContain('1d6 phy');
    });

    it('should render a damage modifier when there is no notation', () => {
      setUpAndFlush(1, [
        buildBeastform({ damage: { diceType: 'D8', modifier: 2, damageType: 'PHYSICAL' } }),
      ]);

      expect(component.beastforms()[0].statLine).toContain('d8+2 phy');
    });

    it('should skip trait modifiers that are zero', () => {
      setUpAndFlush(1, [buildBeastform({ agilityModifier: 0, strengthModifier: 1 })]);

      expect(component.beastforms()[0].statLine).toContain('Strength +1');
      expect(component.beastforms()[0].statLine).not.toContain('Agility');
    });
  });

  describe('stat-less "Evolved" cards', () => {
    it('should produce a null stat line rather than "undefined"', () => {
      setUpAndFlush(5, [buildStatlessBeastform()]);

      expect(component.beastforms()[0].statLine).toBeNull();
    });

    it('should produce a null attack line', () => {
      setUpAndFlush(5, [buildStatlessBeastform()]);

      expect(component.beastforms()[0].attackLine).toBeNull();
    });

    it('should render without printing "undefined" when expanded', () => {
      setUpAndFlush(5, [buildStatlessBeastform()]);

      component.toggleForm(17);
      fixture.detectChanges();

      expect(text()).not.toContain('undefined');
      expect(text()).not.toContain('NaN');
    });

    it('should still show the feature text when expanded', () => {
      setUpAndFlush(5, [buildStatlessBeastform()]);

      component.toggleForm(17);
      fixture.detectChanges();

      expect(text()).toContain('Evolved');
      expect(text()).toContain('Pick a Tier 1 Beastform option.');
    });

    it('should list the tier 4 Mythic Beast for a level 10 character', () => {
      setUpAndFlush(10, [buildStatlessBeastform({ id: 24, name: 'Mythic Beast', tier: 4 })]);

      expect(component.availableCount()).toBe(1);
    });
  });

  describe('states', () => {
    it('should show a loading message while the request is in flight', () => {
      setUp(5);
      component.toggleSection();
      fixture.detectChanges();

      expect(text()).toContain('Loading beastforms');

      httpTesting.expectOne(r => r.url === baseUrl).flush(buildPage([]));
    });

    it('should show an error message when the request fails', () => {
      setUp(5);
      component.toggleSection();
      httpTesting
        .expectOne(r => r.url === baseUrl)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.loadError()).toBe(true);
      expect(text()).toContain('Failed to load beastforms.');
    });

    it('should refetch when retry is pressed after an error', () => {
      setUp(5);
      component.toggleSection();
      httpTesting
        .expectOne(r => r.url === baseUrl)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      component.loadForms();

      httpTesting.expectOne(r => r.url === baseUrl).flush(buildPage([buildBeastform()]));
      fixture.detectChanges();
      expect(component.loadError()).toBe(false);
      expect(component.availableCount()).toBe(1);
    });

    it('should show an empty message when no form is at or below the tier', () => {
      setUpAndFlush(1, [buildBeastform({ tier: 4 })]);

      expect(text()).toContain('No beastform options available at your tier.');
    });

    it('should not show the empty message before anything has loaded', () => {
      setUp(1);

      expect(text()).not.toContain('No beastform options available');
    });
  });

  describe('per-form expansion', () => {
    it('should start with every form collapsed', () => {
      setUpAndFlush(1, [buildBeastform()]);

      expect(component.isFormExpanded(1)).toBe(false);
    });

    it('should show the attack line and advantages once a form is expanded', () => {
      setUpAndFlush(1, [buildBeastform()]);

      component.toggleForm(1);
      fixture.detectChanges();

      expect(text()).toContain('Melee · Agility · d4 phy');
      expect(text()).toContain('climb, locate, protect');
    });

    it('should collapse a form again on a second toggle', () => {
      setUpAndFlush(1, [buildBeastform()]);

      component.toggleForm(1);
      component.toggleForm(1);

      expect(component.isFormExpanded(1)).toBe(false);
    });
  });
});
