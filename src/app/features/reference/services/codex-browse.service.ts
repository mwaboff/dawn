import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WeaponService } from '../../../shared/services/weapon.service';
import { ArmorService } from '../../../shared/services/armor.service';
import { LootService } from '../../../shared/services/loot.service';
import { AdversaryService } from '../../../shared/services/adversary.service';
import { ClassService } from '../../../shared/services/class.service';
import { AncestryService } from '../../../shared/services/ancestry.service';
import { CommunityService } from '../../../shared/services/community.service';
import { DomainService } from '../../../shared/services/domain.service';
import { SubclassService } from '../../../shared/services/subclass.service';
import { CompanionService } from '../../../shared/services/companion.service';
import { BrowseResult, SearchableEntityType } from '../models/search.model';

/** Entity types that have a per-type list endpoint available for browse mode. */
export type BrowsableType = Extract<
  SearchableEntityType,
  | 'WEAPON'
  | 'ARMOR'
  | 'LOOT'
  | 'ADVERSARY'
  | 'CLASS'
  | 'ANCESTRY_CARD'
  | 'COMMUNITY_CARD'
  | 'DOMAIN_CARD'
  | 'DOMAIN'
  | 'SUBCLASS_CARD'
  | 'COMPANION'
>;

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
  private readonly classService = inject(ClassService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);
  private readonly domainService = inject(DomainService);
  private readonly subclassService = inject(SubclassService);
  private readonly companionService = inject(CompanionService);

  browse(type: BrowsableType, filters: BrowseFilters, page: number): Observable<BrowseResult> {
    switch (type) {
      case 'WEAPON':
        return this.weaponService.getWeapons({
          page,
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
          tier: filters['tier'] as number | undefined,
          burden: filters['burden'] as string | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'LOOT':
        return this.lootService.getLoot({
          page,
          tier: filters['tier'] as number | undefined,
          isConsumable: filters['isConsumable'] as boolean | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          expansionId: filters['expansionId'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'ADVERSARY':
        return this.adversaryService.getAdversaries({
          page,
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

      case 'CLASS':
        return this.classService.getClassesPaginated({
          page,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'ANCESTRY_CARD':
        return this.ancestryService.getAncestriesPaginated({
          page,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'COMMUNITY_CARD':
        return this.communityService.getCommunitiesPaginated({
          page,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'DOMAIN_CARD':
        return this.domainService.getDomainCardsBrowse({
          page,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
          associatedDomainId: filters['associatedDomainId'] as number | undefined,
          tier: filters['tier'] as number | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'DOMAIN':
        return this.domainService.getDomainsPaginated(page).pipe(
          map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)),
        );

      case 'SUBCLASS_CARD':
        return this.subclassService.getSubclassesPaginated({
          page,
          associatedClassId: filters['associatedClassId'] as number | undefined,
          expansionId: filters['expansionId'] as number | undefined,
          isOfficial: filters['isOfficial'] as boolean | undefined,
        }).pipe(map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)));

      case 'COMPANION':
        return this.companionService.getCompanionsPaginated({ page }).pipe(
          map(r => toCardResult(r.cards, r.currentPage, r.totalPages, r.totalElements)),
        );
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
