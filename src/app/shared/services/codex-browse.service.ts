import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WeaponService } from './weapon.service';
import { ArmorService } from './armor.service';
import { LootService } from './loot.service';
import { AdversaryService } from './adversary.service';
import { EnvironmentService } from './environment.service';
import { BeastformService } from './beastform.service';
import { ClassService } from './class.service';
import { AncestryService } from './ancestry.service';
import { CommunityService } from './community.service';
import { DomainService } from './domain.service';
import { SubclassService } from './subclass.service';
import { CompanionService } from './companion.service';
import { FeatureLookupService } from './feature-lookup.service';
import { BrowseResult, SearchableEntityType } from '../models/search.model';

/**
 * Entity types that have a per-type list endpoint available for browse mode, backing
 * `browse()`'s exhaustive switch below.
 *
 * This array is the single source of truth: `BrowsableType` is derived from it (not declared
 * independently), and `isBrowsableType()` is generated from the same array. A caller that
 * narrows a `SearchableEntityType` via `isBrowsableType()` gets a value the compiler accepts
 * for `browse()` -- there is no way for the two to drift out of sync, unlike the previous
 * design where an unchecked `as BrowsableType` cast (e.g. `reference.ts`) could hand `browse()`
 * a type its switch had no case for, falling through to `undefined` and crashing the caller's
 * `.pipe()` call. See `SUPPORTED_BROWSE_TYPES` usage in `reference.ts` for the fix on that side.
 */
export const SUPPORTED_BROWSE_TYPES = [
  'WEAPON', 'ARMOR', 'LOOT', 'ADVERSARY', 'ENVIRONMENT', 'CLASS', 'ANCESTRY_CARD',
  'COMMUNITY_CARD', 'DOMAIN_CARD', 'DOMAIN', 'SUBCLASS_CARD', 'COMPANION', 'FEATURE', 'BEASTFORM',
] as const satisfies readonly SearchableEntityType[];

export type BrowsableType = typeof SUPPORTED_BROWSE_TYPES[number];

/** Type guard narrowing a `SearchableEntityType` to `BrowsableType`, backed by the same array `browse()`'s switch handles. */
export function isBrowsableType(type: SearchableEntityType): type is BrowsableType {
  return (SUPPORTED_BROWSE_TYPES as readonly SearchableEntityType[]).includes(type);
}

export type BrowseFilters = Record<string, unknown>;

/**
 * Wraps the per-type list endpoints behind a unified interface for browse mode
 * (query empty, type selected). The Reference component calls this service
 * instead of injecting all 10 per-type services directly, keeping the parent
 * component lean and consolidating the dispatch logic here.
 */
@Injectable({ providedIn: 'root' })
export class CodexBrowseService {
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);
  private readonly adversaryService = inject(AdversaryService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly beastformService = inject(BeastformService);
  private readonly classService = inject(ClassService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);
  private readonly domainService = inject(DomainService);
  private readonly subclassService = inject(SubclassService);
  private readonly companionService = inject(CompanionService);
  private readonly featureLookupService = inject(FeatureLookupService);

  /**
   * @param size Optional page size. Every backing endpoint clamps this to 100 server-side
   *   (see `Math.min(size, 100)` in the core services), so larger values silently return 100.
   */
  browse(type: BrowsableType, filters: BrowseFilters, page: number, size?: number): Observable<BrowseResult> {
    switch (type) {
      case 'WEAPON':
        return this.weaponService.getWeapons({
          page,
          size,
          tier: filters['tier'] as number | undefined,
          trait: filters['trait'] as string | undefined,
          range: filters['range'] as string | undefined,
          burden: filters['burden'] as string | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'ARMOR':
        return this.armorService.getArmors({
          page,
          size,
          tier: filters['tier'] as number | undefined,
          burden: filters['burden'] as string | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'LOOT':
        return this.lootService.getLoot({
          page,
          size,
          tier: filters['tier'] as number | undefined,
          isConsumable: filters['isConsumable'] as boolean | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'ADVERSARY':
        return this.adversaryService.getAdversaries({
          page,
          size,
          tier: filters['tier'] as number | undefined,
          adversaryType: filters['adversaryType'] as string | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => ({
          cards: [],
          adversaries: r.adversaries,
          currentPage: r.currentPage,
          totalPages: r.totalPages,
          totalElements: r.totalElements,
        })));

      case 'ENVIRONMENT':
        return this.environmentService.getEnvironmentsPaginated({
          page,
          size,
          tier: filters['tier'] as number | undefined,
          environmentType: filters['environmentType'] as string | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'BEASTFORM':
        return this.beastformService.getBeastformsPaginated({
          page,
          size,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'CLASS':
        return this.classService.getClassesPaginated({
          page,
          size,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'ANCESTRY_CARD':
        return this.ancestryService.getAncestriesPaginated({
          page,
          size,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'COMMUNITY_CARD':
        return this.communityService.getCommunitiesPaginated({
          page,
          size,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'DOMAIN_CARD':
        return this.domainService.getDomainCardsBrowse({
          page,
          size,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          associatedDomainId: filters['associatedDomainId'] as number | undefined,
          tier: filters['tier'] as number | undefined,
          level: filters['level'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'DOMAIN':
        return this.domainService.getDomainsPaginated({
          page,
          size,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'SUBCLASS_CARD':
        return this.subclassService.getSubclassesPaginated({
          page,
          size,
          associatedClassId: filters['associatedClassId'] as number | undefined,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'COMPANION':
        return this.companionService.getCompanionsPaginated({ page, size }).pipe(
          map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)),
        );

      case 'FEATURE':
        return this.featureLookupService.getFeaturesPaginated({
          page,
          size,
          expansionId: filters['expansionId'] as number | undefined,
          featureType: filters['featureType'] as string | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));
    }
  }
}

function toCardResult(
  cards: BrowseResult['cards'],
  currentPage: number,
  totalPages: number,
  totalElements: number,
): BrowseResult {
  return { cards, adversaries: [], currentPage, totalPages, totalElements };
}
