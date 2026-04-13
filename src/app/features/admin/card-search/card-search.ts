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
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { CardSelectionGrid } from '../../../shared/components/card-selection-grid/card-selection-grid';
import { CardSkeleton } from '../../../shared/components/card-skeleton/card-skeleton';
import { ClassService } from '../../../shared/services/class.service';
import { AncestryService } from '../../../shared/services/ancestry.service';
import { CommunityService } from '../../../shared/services/community.service';
import { DomainService } from '../../../shared/services/domain.service';
import { WeaponService } from '../../../shared/services/weapon.service';
import { ArmorService } from '../../../shared/services/armor.service';
import { LootService } from '../../../shared/services/loot.service';
import { CompanionService } from '../../../shared/services/companion.service';

const ADMIN_CATEGORIES: { id: string; label: string }[] = [
  { id: 'domain', label: 'Domains' },
  { id: 'class', label: 'Classes' },
  { id: 'ancestry', label: 'Ancestries' },
  { id: 'community', label: 'Communities' },
  { id: 'domainCard', label: 'Domain Cards' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'loot', label: 'Loot' },
  { id: 'companion', label: 'Companions' },
];

@Component({
  selector: 'app-card-search',
  templateUrl: './card-search.html',
  styleUrl: './card-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardSelectionGrid, CardSkeleton],
})
export class CardSearch {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly classService = inject(ClassService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);
  private readonly domainService = inject(DomainService);
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);
  private readonly companionService = inject(CompanionService);

  readonly categories = ADMIN_CATEGORIES;
  readonly activeCategory = signal<string | null>(null);
  readonly searchQuery = signal('');
  private readonly allCards = signal<CardData[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly hasCards = computed(() => this.allCards().length > 0);

  readonly filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cards = this.allCards();
    if (!query) return cards;
    return cards.filter(card => card.name.toLowerCase().includes(query));
  });

  constructor() {
    effect(() => {
      const category = this.activeCategory();
      if (category) this.fetchCards(category);
    });
  }

  onCategorySelected(categoryId: string): void {
    this.searchQuery.set('');
    this.activeCategory.set(categoryId);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onCardSelected(card: CardData): void {
    const category = this.activeCategory();
    if (category) {
      this.router.navigate(['/admin/cards', category, card.id]);
    }
  }

  private fetchCards(category: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.allCards.set([]);

    const handlers = {
      next: (cards: CardData[]) => { this.allCards.set(cards); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    };

    const paginatedHandlers = {
      next: (result: { cards: CardData[] }) => { this.allCards.set(result.cards); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    };

    switch (category) {
      case 'class':
        this.classService.getClasses(0).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(handlers);
        break;
      case 'ancestry':
        this.ancestryService.getAncestries(0).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(handlers);
        break;
      case 'community':
        this.communityService.getCommunities(0).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(handlers);
        break;
      case 'domain':
        this.domainService.getDomains().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(handlers);
        break;
      case 'domainCard':
        this.domainService.loadDomainLookup().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: lookup => {
            const allIds = Array.from(lookup.values());
            if (allIds.length === 0) {
              this.allCards.set([]);
              this.loading.set(false);
              return;
            }
            this.domainService.getDomainCards(allIds, 0)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(handlers);
          },
          error: () => { this.error.set(true); this.loading.set(false); },
        });
        break;
      case 'weapon':
        this.weaponService.getWeapons({ page: 0 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paginatedHandlers);
        break;
      case 'armor':
        this.armorService.getArmors({ page: 0 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paginatedHandlers);
        break;
      case 'loot':
        this.lootService.getLoot({ page: 0 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paginatedHandlers);
        break;
      case 'companion':
        this.companionService.getCompanions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(handlers);
        break;
      default:
        this.loading.set(false);
    }
  }
}
