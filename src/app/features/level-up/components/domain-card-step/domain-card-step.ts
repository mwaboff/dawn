import { Component, input, output, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { DomainCardSummary } from '../../../character-sheet/models/character-sheet-view.model';

@Component({
  selector: 'app-domain-card-step',
  imports: [CardSelectionGrid],
  templateUrl: './domain-card-step.html',
  styleUrl: './domain-card-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainCardStep implements OnInit {
  private readonly domainService = inject(DomainService);

  readonly accessibleDomainIds = input.required<number[]>();
  readonly domainCardLevelCap = input.required<number | null>();
  readonly equippedDomainCardCount = input.required<number>();
  readonly maxEquippedDomainCards = input.required<number>();
  readonly ownedDomainCardIds = input.required<number[]>();
  readonly equippedDomainCards = input<DomainCardSummary[]>([]);
  readonly targetLevel = input<number | null>(null);
  readonly maxSelections = input<number>(1);
  readonly initialCards = input<CardData[]>([]);
  readonly initialEquip = input<boolean>(false);
  readonly initialUnequipId = input<number | undefined>(undefined);

  readonly domainCardsSelected = output<CardData[]>();
  readonly equipChanged = output<boolean>();
  readonly unequipCardIdChanged = output<number | undefined>();

  readonly availableCards = signal<CardData[]>([]);
  readonly loading = signal(false);
  readonly selectedCards = signal<CardData[]>([]);
  readonly equipNewCard = signal(false);
  readonly unequipCardId = signal<number | undefined>(undefined);
  readonly selectedLevels = signal<Set<number>>(new Set());

  readonly availableLevels = computed(() => {
    const levels = new Set(this.availableCards().map(c => c.metadata?.['level'] as number).filter(l => l != null));
    return [...levels].sort((a, b) => a - b);
  });

  readonly filteredCards = computed(() => {
    const selected = this.selectedLevels();
    if (selected.size === 0) return this.availableCards();
    return this.availableCards().filter(c => {
      const level = c.metadata?.['level'] as number;
      return level != null && selected.has(level);
    });
  });

  readonly selectionCount = computed(() => this.selectedCards().length);

  readonly isSelectionComplete = computed(() => this.selectionCount() >= this.maxSelections());

  ngOnInit(): void {
    const initial = this.initialCards();
    if (initial.length > 0) {
      this.selectedCards.set([...initial]);
    }
    if (this.initialEquip()) {
      this.equipNewCard.set(true);
    }
    if (this.initialUnequipId()) {
      this.unequipCardId.set(this.initialUnequipId());
    }
    const target = this.targetLevel();
    if (target != null) {
      this.selectedLevels.set(new Set([target]));
    }
    this.loadCards();
  }

  get canEquip(): boolean {
    return this.equippedDomainCardCount() < this.maxEquippedDomainCards();
  }

  get needsUnequip(): boolean {
    return this.equipNewCard() && this.equippedDomainCardCount() >= this.maxEquippedDomainCards();
  }

  isLevelSelected(level: number): boolean {
    return this.selectedLevels().size === 0 || this.selectedLevels().has(level);
  }

  toggleLevel(level: number): void {
    const current = new Set(this.selectedLevels());
    if (current.has(level)) {
      current.delete(level);
      this.selectedLevels.set(current);
    } else {
      current.add(level);
      this.selectedLevels.set(current);
    }
  }

  selectAllLevels(): void {
    this.selectedLevels.set(new Set());
  }

  get isAllSelected(): boolean {
    return this.selectedLevels().size === 0;
  }

  onSingleCardSelected(card: CardData): void {
    this.selectedCards.set([card]);
    this.domainCardsSelected.emit([card]);
  }

  onMultiCardsSelected(cards: CardData[]): void {
    this.selectedCards.set(cards);
    this.domainCardsSelected.emit(cards);
  }

  onEquipToggle(): void {
    const newValue = !this.equipNewCard();
    this.equipNewCard.set(newValue);
    this.equipChanged.emit(newValue);
    if (!newValue) {
      this.unequipCardId.set(undefined);
      this.unequipCardIdChanged.emit(undefined);
    }
  }

  onUnequipCard(cardId: number): void {
    this.unequipCardId.set(cardId);
    this.unequipCardIdChanged.emit(cardId);
  }

  private loadCards(): void {
    const domainIds = this.accessibleDomainIds();
    if (domainIds.length === 0) return;

    const cap = this.domainCardLevelCap();
    const target = this.targetLevel();
    const effectiveCap = cap != null && target != null ? Math.min(cap, target) : (cap ?? target);
    const levels = effectiveCap ? Array.from({ length: effectiveCap }, (_, i) => i + 1) : undefined;
    const owned = new Set(this.ownedDomainCardIds());

    this.loading.set(true);
    this.domainService.getDomainCards(domainIds, 0, 100, levels).subscribe({
      next: cards => {
        this.availableCards.set(cards.filter(c => !owned.has(c.id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
