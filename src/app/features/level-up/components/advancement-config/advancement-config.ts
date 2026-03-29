import { Component, input, output, signal, computed, inject, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { SubclassPathSelector } from '../../../../shared/components/subclass-path-selector/subclass-path-selector';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { AvailableAdvancement, AdvancementChoice, AdvancementType, TraitEnum, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CharacterSheetView, TraitDisplay, ExperienceDisplay } from '../../../character-sheet/models/character-sheet-view.model';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { SubclassService } from '../../../../shared/services/subclass.service';
import { SubclassPathService } from '../../../../shared/services/subclass-path.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-advancement-config',
  imports: [CardSelectionGrid, SubclassPathSelector, FormatTextPipe],
  templateUrl: './advancement-config.html',
  styleUrl: './advancement-config.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancementConfig implements OnInit {
  private readonly domainService = inject(DomainService);
  private readonly subclassService = inject(SubclassService);
  private readonly subclassPathService = inject(SubclassPathService);

  readonly advancement = input.required<AvailableAdvancement>();
  readonly characterSheet = input.required<CharacterSheetView>();
  readonly levelUpOptions = input.required<LevelUpOptionsResponse>();
  readonly initialChoice = input<AdvancementChoice>();

  readonly newExperienceDescription = input<string>('');
  readonly excludedTraits = input<TraitEnum[]>([]);

  readonly configChanged = output<AdvancementChoice>();

  readonly boostNewExperience = signal(false);
  readonly selectedTraits = signal<TraitEnum[]>([]);
  readonly selectedExperienceIds = signal<number[]>([]);
  readonly domainCards = signal<CardData[]>([]);
  readonly domainCardsLoading = signal(false);
  readonly selectedDomainCard = signal<CardData | undefined>(undefined);
  readonly equipDomainCard = signal(false);

  readonly subclassCards = signal<CardData[]>([]);
  readonly subclassCardsLoading = signal(false);
  readonly selectedSubclassCard = signal<CardData | undefined>(undefined);

  readonly multiclassCards = signal<CardData[]>([]);
  readonly multiclassCardsLoading = signal(false);
  readonly selectedMulticlassCard = signal<CardData | undefined>(undefined);
  readonly multiclassClassFilter = signal<string | null>(null);

  readonly ownedSubclassCardIds = computed(() => this.characterSheet().subclassCards.map(c => c.id));

  readonly multiclassAvailableClasses = computed(() => {
    const cards = this.multiclassCards();
    const classNames = new Set<string>();
    for (const card of cards) {
      const className = card.metadata?.['associatedClassName'] as string;
      if (className) classNames.add(className);
    }
    return [...classNames].sort();
  });

  readonly filteredMulticlassCards = computed(() => {
    const filter = this.multiclassClassFilter();
    const cards = this.multiclassCards();
    if (!filter) return cards;
    return cards.filter(c => (c.metadata?.['associatedClassName'] as string) === filter);
  });

  constructor() {
    effect(() => {
      const excluded = this.excludedTraits();
      if (excluded.length === 0) return;

      const current = this.selectedTraits();
      const filtered = current.filter(t => !excluded.includes(t));
      if (filtered.length !== current.length) {
        this.selectedTraits.set(filtered);
        this.emitChoice({ type: 'BOOST_TRAITS', traits: filtered });
      }
    });
  }

  get type(): AdvancementType {
    return this.advancement().type;
  }

  get marksWillBeCleared(): boolean {
    const options = this.levelUpOptions();
    return options.tierTransition && (options.nextTier === 3 || options.nextTier === 4);
  }

  get selectableTraits(): TraitDisplay[] {
    if (this.marksWillBeCleared) {
      return this.characterSheet().traits;
    }
    return this.characterSheet().traits.filter(t => !t.marked);
  }

  get experiences(): ExperienceDisplay[] {
    return this.characterSheet().experiences;
  }

  readonly newExperienceBaseModifier = 2;

  ngOnInit(): void {
    const initial = this.initialChoice();
    if (initial) {
      if (initial.traits) this.selectedTraits.set([...initial.traits]);
      if (initial.experienceIds) this.selectedExperienceIds.set([...initial.experienceIds]);
      if (initial.boostNewExperience) this.boostNewExperience.set(true);
    }

    if (this.type === 'GAIN_DOMAIN_CARD') {
      this.loadDomainCards();
    } else if (this.type === 'UPGRADE_SUBCLASS') {
      this.loadSubclassUpgrades();
    } else if (this.type === 'MULTICLASS') {
      this.loadMulticlassCards();
    }
  }

  toggleTrait(traitName: string): void {
    const traitEnum = traitName.toUpperCase() as TraitEnum;
    const current = this.selectedTraits();
    const idx = current.indexOf(traitEnum);

    let updated: TraitEnum[];
    if (idx >= 0) {
      updated = current.filter(t => t !== traitEnum);
    } else if (current.length < 2) {
      updated = [...current, traitEnum];
    } else {
      return;
    }

    this.selectedTraits.set(updated);
    this.emitChoice({ type: 'BOOST_TRAITS', traits: updated });
  }

  isTraitSelected(traitName: string): boolean {
    return this.selectedTraits().includes(traitName.toUpperCase() as TraitEnum);
  }

  isTraitExcluded(traitName: string): boolean {
    return this.excludedTraits().includes(traitName.toUpperCase() as TraitEnum);
  }

  private get totalExperienceSelections(): number {
    return this.selectedExperienceIds().length + (this.boostNewExperience() ? 1 : 0);
  }

  toggleExperience(id: number): void {
    const current = this.selectedExperienceIds();
    const idx = current.indexOf(id);

    if (idx >= 0) {
      this.selectedExperienceIds.set(current.filter(e => e !== id));
    } else if (this.totalExperienceSelections < 2) {
      const updated = [...current, id];
      this.selectedExperienceIds.set(updated);
      if (updated.length + (this.boostNewExperience() ? 1 : 0) === 2) {
        this.emitChoice({ type: 'BOOST_EXPERIENCES', experienceIds: updated, boostNewExperience: this.boostNewExperience() || undefined });
      }
    }
  }

  toggleNewExperience(): void {
    const wasSelected = this.boostNewExperience();
    this.boostNewExperience.set(!wasSelected);

    if (wasSelected) {
      return;
    }

    const ids = this.selectedExperienceIds();
    if (ids.length + 1 === 2) {
      this.emitChoice({ type: 'BOOST_EXPERIENCES', experienceIds: ids, boostNewExperience: true });
    }
  }

  isExperienceSelected(id: number): boolean {
    return this.selectedExperienceIds().includes(id);
  }

  isExperienceAtMax(): boolean {
    return this.totalExperienceSelections >= 2;
  }

  onDomainCardSelected(card: CardData): void {
    this.selectedDomainCard.set(card);
    this.emitChoice({ type: 'GAIN_DOMAIN_CARD', domainCardId: card.id, equipDomainCard: this.equipDomainCard() });
  }

  onEquipDomainCardToggle(): void {
    const current = !this.equipDomainCard();
    this.equipDomainCard.set(current);
    const card = this.selectedDomainCard();
    if (card) {
      this.emitChoice({ type: 'GAIN_DOMAIN_CARD', domainCardId: card.id, equipDomainCard: current });
    }
  }

  onSubclassCardSelected(card: CardData): void {
    this.selectedSubclassCard.set(card);
    this.emitChoice({ type: 'UPGRADE_SUBCLASS', subclassCardId: card.id });
  }

  onMulticlassClassFilterSelected(className: string | null): void {
    this.multiclassClassFilter.set(className);
  }

  onMulticlassCardSelected(card: CardData): void {
    this.selectedMulticlassCard.set(card);
    this.emitChoice({ type: 'MULTICLASS', subclassCardId: card.id });
  }

  private emitChoice(choice: AdvancementChoice): void {
    this.configChanged.emit(choice);
  }

  private loadDomainCards(): void {
    const options = this.levelUpOptions();
    if (options.accessibleDomainIds.length === 0) return;

    const levels = options.domainCardLevelCap
      ? Array.from({ length: options.domainCardLevelCap }, (_, i) => i + 1)
      : undefined;

    this.domainCardsLoading.set(true);
    this.domainService.getDomainCards(options.accessibleDomainIds, 0, 100, levels).subscribe({
      next: cards => { this.domainCards.set(cards); this.domainCardsLoading.set(false); },
      error: () => this.domainCardsLoading.set(false),
    });
  }

  private loadSubclassUpgrades(): void {
    const sheet = this.characterSheet();
    const classIds = [...new Set(
      sheet.subclassCards
        .map(c => c.associatedClassId)
        .filter((id): id is number => id != null)
    )];

    if (classIds.length === 0) return;
    this.subclassCardsLoading.set(true);

    forkJoin(classIds.map(id => this.subclassService.getSubclasses(id))).subscribe({
      next: results => {
        const allCards = results.flat();
        const currentPathNames = new Set(
          sheet.subclassCards
            .map(c => c.subclassPathName)
            .filter((name): name is string => name != null)
        );
        const filtered = allCards.filter(c => {
          const pathName = c.metadata?.['subclassPathName'] as string;
          return pathName && currentPathNames.has(pathName);
        });
        this.subclassCards.set(filtered);
        this.subclassCardsLoading.set(false);
      },
      error: () => this.subclassCardsLoading.set(false),
    });
  }

  private loadMulticlassCards(): void {
    this.multiclassCardsLoading.set(true);
    this.subclassPathService.getSubclassPaths().subscribe({
      next: paths => {
        const existingClassIds = new Set(
          this.characterSheet().subclassCards
            .map(c => c.associatedClassId)
            .filter((id): id is number => id != null)
        );
        const eligibleClassIds = [...new Set(
          paths
            .map(p => p.metadata?.['associatedClassId'] as number)
            .filter(id => id != null && !existingClassIds.has(id))
        )];

        if (eligibleClassIds.length === 0) {
          this.multiclassCards.set([]);
          this.multiclassCardsLoading.set(false);
          return;
        }

        forkJoin(eligibleClassIds.map(id => this.subclassService.getSubclasses(id))).subscribe({
          next: results => {
            this.multiclassCards.set(results.flat());
            this.multiclassCardsLoading.set(false);
          },
          error: () => this.multiclassCardsLoading.set(false),
        });
      },
      error: () => this.multiclassCardsLoading.set(false),
    });
  }
}
