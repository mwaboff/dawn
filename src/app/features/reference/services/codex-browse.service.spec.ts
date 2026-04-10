import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CodexBrowseService } from './codex-browse.service';
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
import { BrowseResult } from '../models/search.model';
import { PaginatedCards } from '../../../shared/models/api.model';

function buildPaginatedCards(overrides: Partial<PaginatedCards> = {}): PaginatedCards {
  return {
    cards: [],
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    ...overrides,
  };
}

function buildPaginatedAdversaries() {
  return {
    adversaries: [{ id: 1, name: 'Dragon', tier: 3, adversaryType: 'SOLO', description: '' }],
    currentPage: 0,
    totalPages: 1,
    totalElements: 1,
  };
}

describe('CodexBrowseService', () => {
  let service: CodexBrowseService;
  let weaponSpy: { getWeapons: ReturnType<typeof vi.fn> };
  let armorSpy: { getArmors: ReturnType<typeof vi.fn> };
  let lootSpy: { getLoot: ReturnType<typeof vi.fn> };
  let adversarySpy: { getAdversaries: ReturnType<typeof vi.fn> };
  let classSpy: { getClassesPaginated: ReturnType<typeof vi.fn> };
  let ancestrySpy: { getAncestriesPaginated: ReturnType<typeof vi.fn> };
  let communitySpy: { getCommunitiesPaginated: ReturnType<typeof vi.fn> };
  let domainSpy: { getDomainCardsBrowse: ReturnType<typeof vi.fn>; getDomainsPaginated: ReturnType<typeof vi.fn> };
  let subclassSpy: { getSubclassesPaginated: ReturnType<typeof vi.fn> };
  let companionSpy: { getCompanionsPaginated: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    weaponSpy = { getWeapons: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    armorSpy = { getArmors: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    lootSpy = { getLoot: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    adversarySpy = { getAdversaries: vi.fn().mockReturnValue(of(buildPaginatedAdversaries())) };
    classSpy = { getClassesPaginated: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    ancestrySpy = { getAncestriesPaginated: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    communitySpy = { getCommunitiesPaginated: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    domainSpy = {
      getDomainCardsBrowse: vi.fn().mockReturnValue(of(buildPaginatedCards())),
      getDomainsPaginated: vi.fn().mockReturnValue(of(buildPaginatedCards())),
    };
    subclassSpy = { getSubclassesPaginated: vi.fn().mockReturnValue(of(buildPaginatedCards())) };
    companionSpy = { getCompanionsPaginated: vi.fn().mockReturnValue(of(buildPaginatedCards())) };

    TestBed.configureTestingModule({
      providers: [
        CodexBrowseService,
        { provide: WeaponService, useValue: weaponSpy },
        { provide: ArmorService, useValue: armorSpy },
        { provide: LootService, useValue: lootSpy },
        { provide: AdversaryService, useValue: adversarySpy },
        { provide: ClassService, useValue: classSpy },
        { provide: AncestryService, useValue: ancestrySpy },
        { provide: CommunityService, useValue: communitySpy },
        { provide: DomainService, useValue: domainSpy },
        { provide: SubclassService, useValue: subclassSpy },
        { provide: CompanionService, useValue: companionSpy },
      ],
    });
    service = TestBed.inject(CodexBrowseService);
  });

  it('should dispatch WEAPON to WeaponService.getWeapons with correct filters', () => {
    service.browse('WEAPON', { tier: 2, trait: 'AGILITY', burden: 'ONE_HANDED' }, 1).subscribe();

    expect(weaponSpy.getWeapons).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, tier: 2, trait: 'AGILITY', burden: 'ONE_HANDED' }),
    );
  });

  it('should dispatch ARMOR to ArmorService.getArmors with correct filters', () => {
    service.browse('ARMOR', { tier: 1, burden: 'TWO_HANDED', isOfficial: true }, 0).subscribe();

    expect(armorSpy.getArmors).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, tier: 1, burden: 'TWO_HANDED', isOfficial: true }),
    );
  });

  it('should dispatch LOOT to LootService.getLoot with correct filters', () => {
    service.browse('LOOT', { isConsumable: true, isOfficial: false }, 0).subscribe();

    expect(lootSpy.getLoot).toHaveBeenCalledWith(
      expect.objectContaining({ isConsumable: true, isOfficial: false }),
    );
  });

  it('should dispatch ADVERSARY to AdversaryService.getAdversaries', () => {
    service.browse('ADVERSARY', { adversaryType: 'BOSS', tier: 3 }, 0).subscribe();

    expect(adversarySpy.getAdversaries).toHaveBeenCalledWith(
      expect.objectContaining({ adversaryType: 'BOSS', tier: 3 }),
    );
  });

  it('should dispatch CLASS to ClassService.getClassesPaginated', () => {
    service.browse('CLASS', { isOfficial: true }, 0).subscribe();

    expect(classSpy.getClassesPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ isOfficial: true }),
    );
  });

  it('should dispatch ANCESTRY_CARD to AncestryService.getAncestriesPaginated', () => {
    service.browse('ANCESTRY_CARD', { expansionId: 2 }, 0).subscribe();

    expect(ancestrySpy.getAncestriesPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ expansionId: 2 }),
    );
  });

  it('should dispatch COMMUNITY_CARD to CommunityService.getCommunitiesPaginated', () => {
    service.browse('COMMUNITY_CARD', {}, 0).subscribe();

    expect(communitySpy.getCommunitiesPaginated).toHaveBeenCalled();
  });

  it('should dispatch DOMAIN_CARD to DomainService.getDomainCardsBrowse', () => {
    service.browse('DOMAIN_CARD', { associatedDomainId: 3, tier: 1 }, 0).subscribe();

    expect(domainSpy.getDomainCardsBrowse).toHaveBeenCalledWith(
      expect.objectContaining({ associatedDomainId: 3, tier: 1 }),
    );
  });

  it('should dispatch DOMAIN to DomainService.getDomainsPaginated', () => {
    service.browse('DOMAIN', {}, 2).subscribe();

    expect(domainSpy.getDomainsPaginated).toHaveBeenCalledWith(2);
  });

  it('should dispatch SUBCLASS_CARD to SubclassService.getSubclassesPaginated', () => {
    service.browse('SUBCLASS_CARD', { associatedClassId: 5 }, 0).subscribe();

    expect(subclassSpy.getSubclassesPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ associatedClassId: 5 }),
    );
  });

  it('should dispatch COMPANION to CompanionService.getCompanionsPaginated', () => {
    service.browse('COMPANION', {}, 0).subscribe();

    expect(companionSpy.getCompanionsPaginated).toHaveBeenCalled();
  });

  it('should return BrowseResult with cards and empty adversaries for WEAPON', () => {
    const mockCards = [{ id: 1, name: 'Sword', description: '', cardType: 'weapon' as const }];
    weaponSpy.getWeapons.mockReturnValue(of({ cards: mockCards, currentPage: 0, totalPages: 2, totalElements: 30 }));

    let result: BrowseResult | undefined;
    service.browse('WEAPON', {}, 0).subscribe(r => (result = r));

    expect(result).toBeDefined();
    expect(result!.cards).toEqual(mockCards);
    expect(result!.adversaries).toEqual([]);
    expect(result!.totalPages).toBe(2);
    expect(result!.totalElements).toBe(30);
  });

  it('should return BrowseResult with adversaries and empty cards for ADVERSARY', () => {
    const paginated = buildPaginatedAdversaries();
    adversarySpy.getAdversaries.mockReturnValue(of(paginated));

    let result: BrowseResult | undefined;
    service.browse('ADVERSARY', {}, 0).subscribe(r => (result = r));

    expect(result).toBeDefined();
    expect(result!.adversaries).toHaveLength(1);
    expect(result!.cards).toEqual([]);
  });

  it('should pass page number to WeaponService', () => {
    service.browse('WEAPON', {}, 3).subscribe();

    expect(weaponSpy.getWeapons).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
  });

  it('should pass page number to ArmorService', () => {
    service.browse('ARMOR', {}, 5).subscribe();

    expect(armorSpy.getArmors).toHaveBeenCalledWith(expect.objectContaining({ page: 5 }));
  });
});
