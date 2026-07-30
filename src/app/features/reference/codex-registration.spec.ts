import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CodexBrowseService, SUPPORTED_BROWSE_TYPES } from '../../shared/services/codex-browse.service';
import { WeaponService } from '../../shared/services/weapon.service';
import { ArmorService } from '../../shared/services/armor.service';
import { LootService } from '../../shared/services/loot.service';
import { AdversaryService } from '../../shared/services/adversary.service';
import { EnvironmentService } from '../../shared/services/environment.service';
import { ClassService } from '../../shared/services/class.service';
import { AncestryService } from '../../shared/services/ancestry.service';
import { CommunityService } from '../../shared/services/community.service';
import { DomainService } from '../../shared/services/domain.service';
import { SubclassService } from '../../shared/services/subclass.service';
import { CompanionService } from '../../shared/services/companion.service';
import { FeatureLookupService } from '../../shared/services/feature-lookup.service';
import { BROWSABLE_TYPES, SearchableEntityType, isSearchableType, typeLabels } from '../../shared/models/search.model';
import { TYPE_FILTERS } from './components/filter-rail/filter-rail';

/**
 * Mirrors `com.aboff.core.model.enums.SearchableEntityType` -- the backend's registered
 * full-text search types. Keep this list in sync with that enum. If a frontend
 * `SearchableEntityType` reaches `SearchService` (i.e. `isSearchableType()` returns true for
 * it) without a matching entry here, the backend has no registration for it and `/api/search`
 * returns HTTP 400 -- exactly the bug `COMPANION` shipped with (see dawn PR fixing
 * "phantom Companion full-text search registration").
 */
const BACKEND_SEARCHABLE_TYPES = [
  'DOMAIN', 'CLASS', 'FEATURE', 'ANCESTRY_CARD', 'COMMUNITY_CARD', 'SUBCLASS_CARD',
  'DOMAIN_CARD', 'WEAPON', 'ARMOR', 'LOOT', 'ADVERSARY', 'BEASTFORM', 'ENCOUNTER',
  'EXPANSION', 'SUBCLASS_PATH', 'QUESTION', 'CARD_COST_TAG', 'ENVIRONMENT',
] as const satisfies readonly SearchableEntityType[];

/**
 * Guards against the exact silent-omission failure the HF-36a packet was written to fix:
 * `BROWSABLE_TYPES` / `SUPPORTED_BROWSE_TYPES` are `Partial<Record<...>>`-backed lookups, so
 * forgetting to register a new type in `typeLabels`, `TYPE_FILTERS`, or `CodexBrowseService.browse()`
 * is a silent gap, not a compile error. This spec asserts every registered type is complete
 * on all three fronts.
 */
describe('codex type registration completeness', () => {
  it('every type reachable via full-text search is registered on the backend', () => {
    // `typeLabels` is keyed by every SearchableEntityType member (there is no runtime array
    // for the frontend union type), so its keys are the full type universe to check.
    const allFrontendTypes = Object.keys(typeLabels) as SearchableEntityType[];
    const searchReachableTypes = allFrontendTypes.filter(isSearchableType);
    for (const type of searchReachableTypes) {
      expect(
        BACKEND_SEARCHABLE_TYPES as readonly SearchableEntityType[],
        `${type} can reach SearchService (isSearchableType() is true) but has no backend ` +
          `SearchableEntityType registration -- add it to SEARCH_UNSUPPORTED_TYPES in ` +
          `search.model.ts if it isn't actually indexed, or to BACKEND_SEARCHABLE_TYPES ` +
          `above once backend indexing is confirmed`,
      ).toContain(type);
    }
  });

  it('every BROWSABLE_TYPES member has a typeLabel', () => {
    for (const type of BROWSABLE_TYPES) {
      expect(typeLabels[type], `typeLabels is missing an entry for ${type}`).toBeDefined();
    }
  });

  it('every BROWSABLE_TYPES member has a TYPE_FILTERS entry', () => {
    // Scoped to BROWSABLE_TYPES, not SUPPORTED_BROWSE_TYPES: FEATURE is browsable internally
    // (backs mixed-search rows) but is deliberately excluded from BROWSABLE_TYPES because it
    // has no standalone card design or user-facing filter rail entry — see BROWSABLE_TYPES'
    // doc comment in search.model.ts.
    for (const type of BROWSABLE_TYPES) {
      expect(TYPE_FILTERS[type], `TYPE_FILTERS is missing an entry for ${type}`).toBeDefined();
    }
  });

  describe('CodexBrowseService.browse() has a working arm for every SUPPORTED_BROWSE_TYPES member', () => {
    let service: CodexBrowseService;

    beforeEach(() => {
      const cardResult = () => of({ cards: [], currentPage: 0, totalPages: 1, totalElements: 0 });
      const adversaryResult = () => of({ adversaries: [], currentPage: 0, totalPages: 1, totalElements: 0 });

      TestBed.configureTestingModule({
        providers: [
          CodexBrowseService,
          { provide: WeaponService, useValue: { getWeapons: vi.fn(cardResult) } },
          { provide: ArmorService, useValue: { getArmors: vi.fn(cardResult) } },
          { provide: LootService, useValue: { getLoot: vi.fn(cardResult) } },
          { provide: AdversaryService, useValue: { getAdversaries: vi.fn(adversaryResult) } },
          { provide: EnvironmentService, useValue: { getEnvironmentsPaginated: vi.fn(cardResult) } },
          { provide: ClassService, useValue: { getClassesPaginated: vi.fn(cardResult) } },
          { provide: AncestryService, useValue: { getAncestriesPaginated: vi.fn(cardResult) } },
          { provide: CommunityService, useValue: { getCommunitiesPaginated: vi.fn(cardResult) } },
          {
            provide: DomainService,
            useValue: { getDomainCardsBrowse: vi.fn(cardResult), getDomainsPaginated: vi.fn(cardResult) },
          },
          { provide: SubclassService, useValue: { getSubclassesPaginated: vi.fn(cardResult) } },
          { provide: CompanionService, useValue: { getCompanionsPaginated: vi.fn(cardResult) } },
          { provide: FeatureLookupService, useValue: { getFeaturesPaginated: vi.fn(cardResult) } },
        ],
      });
      service = TestBed.inject(CodexBrowseService);
    });

    for (const type of SUPPORTED_BROWSE_TYPES) {
      it(`does not throw and returns a defined observable for ${type}`, () => {
        let result: unknown;
        expect(() => {
          service.browse(type, {}, 0).subscribe(r => (result = r));
        }).not.toThrow();
        expect(result, `browse('${type}', ...) produced no result — likely a missing switch arm`).toBeDefined();
      });
    }
  });
});
