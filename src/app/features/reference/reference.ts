import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../shared/components/adversary-card/adversary-card.model';
import {
  ReferenceCategory,
  CATEGORY_CONFIGS,
  CATEGORY_FILTERS,
} from './models/reference.model';
import { CategorySelector } from './components/category-selector/category-selector';
import { ReferenceFilters } from './components/reference-filters/reference-filters';
import { PaginationControls } from './components/pagination-controls/pagination-controls';
import { CardSelectionGrid } from '../../shared/components/card-selection-grid/card-selection-grid';
import { AdversaryCard } from '../../shared/components/adversary-card/adversary-card';
import { CardSkeleton } from '../../shared/components/card-skeleton/card-skeleton';
import { ClassService } from '../../shared/services/class.service';
import { SubclassService } from '../../shared/services/subclass.service';
import { SubclassPathService } from '../../shared/services/subclass-path.service';
import { AncestryService } from '../../shared/services/ancestry.service';
import { CommunityService } from '../../shared/services/community.service';
import { DomainService } from '../../shared/services/domain.service';
import { WeaponService } from '../../shared/services/weapon.service';
import { ArmorService } from '../../shared/services/armor.service';
import { LootService } from '../../shared/services/loot.service';
import { CompanionService } from '../../shared/services/companion.service';
import { AdversaryService } from '../../shared/services/adversary.service';

@Component({
  selector: 'app-reference',
  templateUrl: './reference.html',
  styleUrl: './reference.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CategorySelector,
    ReferenceFilters,
    PaginationControls,
    CardSelectionGrid,
    AdversaryCard,
    CardSkeleton,
  ],
})
export class Reference {
  private readonly destroyRef = inject(DestroyRef);
  private readonly classService = inject(ClassService);
  private readonly subclassService = inject(SubclassService);
  private readonly subclassPathService = inject(SubclassPathService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);
  private readonly domainService = inject(DomainService);
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);
  private readonly companionService = inject(CompanionService);
  private readonly adversaryService = inject(AdversaryService);

  readonly categoryConfigs = CATEGORY_CONFIGS;

  private readonly activeCategory = signal<ReferenceCategory | null>(null);
  private readonly filters = signal<Record<string, unknown>>({});
  private readonly cards = signal<CardData[]>([]);
  private readonly adversaries = signal<AdversaryData[]>([]);
  private readonly loading = signal(false);
  private readonly error = signal(false);
  private readonly currentPage = signal(0);
  private readonly totalPages = signal(0);

  readonly activeCategorySignal = this.activeCategory.asReadonly();
  readonly filtersSignal = this.filters.asReadonly();
  readonly cardsSignal = this.cards.asReadonly();
  readonly adversariesSignal = this.adversaries.asReadonly();
  readonly loadingSignal = this.loading.asReadonly();
  readonly errorSignal = this.error.asReadonly();
  readonly currentPageSignal = this.currentPage.asReadonly();
  readonly totalPagesSignal = this.totalPages.asReadonly();

  readonly categoryConfig = computed(() =>
    CATEGORY_CONFIGS.find(c => c.id === this.activeCategory())
  );

  readonly activeFilters = computed(() =>
    this.activeCategory() ? (CATEGORY_FILTERS[this.activeCategory()!] ?? []) : []
  );

  constructor() {
    effect(() => {
      const category = this.activeCategory();
      this.filters();
      this.currentPage();
      if (category) this.fetchCards();
    });
  }

  onCategorySelected(category: ReferenceCategory): void {
    this.filters.set({});
    this.currentPage.set(0);
    this.activeCategory.set(category);
  }

  onFiltersChanged(newFilters: Record<string, unknown>): void {
    this.currentPage.set(0);
    this.filters.set(newFilters);
  }

  onPageChanged(page: number): void {
    this.currentPage.set(page);
  }

  fetchCards(): void {
    const category = this.activeCategory();
    if (!category) return;

    this.loading.set(true);
    this.error.set(false);
    this.cards.set([]);
    this.adversaries.set([]);

    const filters = this.filters();
    const page = this.currentPage();

    switch (category) {
      case 'classes':
        this.classService
          .getClasses(page)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'subclasses': {
        const classId = filters['classId'] as number | undefined;
        if (!classId) {
          this.cards.set([]);
          this.totalPages.set(1);
          this.loading.set(false);
          break;
        }
        this.subclassService
          .getSubclasses(classId, page)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;
      }

      case 'subclassPaths':
        this.subclassPathService
          .getSubclassPaths()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'ancestries':
        this.ancestryService
          .getAncestries(page)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'communities':
        this.communityService
          .getCommunities(page)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'domains':
        this.domainService
          .getDomains()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'domainCards': {
        const domainId = filters['domainId'] as number | undefined;
        const domainIds = domainId ? [domainId] : [];
        if (domainIds.length === 0) {
          this.domainService
            .loadDomainLookup()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: lookup => {
                const allIds = Array.from(lookup.values());
                if (allIds.length === 0) {
                  this.cards.set([]);
                  this.totalPages.set(1);
                  this.loading.set(false);
                  return;
                }
                this.domainService
                  .getDomainCards(allIds, page)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: result => {
                      this.cards.set(result);
                      this.totalPages.set(1);
                      this.loading.set(false);
                    },
                    error: () => {
                      this.error.set(true);
                      this.loading.set(false);
                    },
                  });
              },
              error: () => {
                this.error.set(true);
                this.loading.set(false);
              },
            });
        } else {
          this.domainService
            .getDomainCards(domainIds, page)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: result => {
                this.cards.set(result);
                this.totalPages.set(1);
                this.loading.set(false);
              },
              error: () => {
                this.error.set(true);
                this.loading.set(false);
              },
            });
        }
        break;
      }

      case 'weapons':
        this.weaponService
          .getWeapons({
            page,
            tier: filters['tier'] as number | undefined,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result.cards);
              this.totalPages.set(result.totalPages);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'armor':
        this.armorService
          .getArmors({
            page,
            tier: filters['tier'] as number | undefined,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result.cards);
              this.totalPages.set(result.totalPages);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'loot':
        this.lootService
          .getLoot({
            page,
            tier: filters['tier'] as number | undefined,
            isConsumable: filters['isConsumable'] as boolean | undefined,
            expansionId: filters['expansionId'] as number | undefined,
            isOfficial: filters['isOfficial'] as boolean | undefined,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result.cards);
              this.totalPages.set(result.totalPages);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'companions':
        this.companionService
          .getCompanions()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.cards.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;

      case 'adversaries':
        this.adversaryService
          .getAdversaries({
            tier: filters['tier'] as number | undefined,
            adversaryType: filters['adversaryType'] as string | undefined,
            isOfficial: filters['isOfficial'] as boolean | undefined,
            expansionId: filters['expansionId'] as number | undefined,
            page,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: result => {
              this.adversaries.set(result);
              this.totalPages.set(1);
              this.loading.set(false);
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
            },
          });
        break;
    }
  }
}
