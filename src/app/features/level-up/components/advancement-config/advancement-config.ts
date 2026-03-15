import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { SubclassPathSelector } from '../../../../shared/components/subclass-path-selector/subclass-path-selector';
import { AvailableAdvancement, AdvancementChoice, AdvancementType, TraitEnum, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CharacterSheetView, TraitDisplay, ExperienceDisplay } from '../../../character-sheet/models/character-sheet-view.model';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { SubclassService } from '../../../../shared/services/subclass.service';
import { SubclassPathService } from '../../../../shared/services/subclass-path.service';

@Component({
  selector: 'app-advancement-config',
  imports: [CardSelectionGrid, SubclassPathSelector],
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

  readonly subclassPaths = signal<CardData[]>([]);
  readonly subclassPathsLoading = signal(false);
  readonly selectedPath = signal<CardData | undefined>(undefined);
  readonly foundationCards = signal<CardData[]>([]);
  readonly foundationCardsLoading = signal(false);
  readonly selectedFoundationCard = signal<CardData | undefined>(undefined);

  get type(): AdvancementType {
    return this.advancement().type;
  }

  get unmarkedTraits(): TraitDisplay[] {
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
      this.loadSubclassPaths();
    }
  }

  toggleTrait(traitName: string): void {
    const traitEnum = traitName.toUpperCase() as TraitEnum;
    const current = this.selectedTraits();
    const idx = current.indexOf(traitEnum);

    if (idx >= 0) {
      this.selectedTraits.set(current.filter(t => t !== traitEnum));
    } else if (current.length < 2) {
      const updated = [...current, traitEnum];
      this.selectedTraits.set(updated);
      if (updated.length === 2) {
        this.emitChoice({ type: 'BOOST_TRAITS', traits: updated });
      }
    }
  }

  isTraitSelected(traitName: string): boolean {
    return this.selectedTraits().includes(traitName.toUpperCase() as TraitEnum);
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

  onPathSelected(card: CardData): void {
    this.selectedPath.set(card);
    this.selectedFoundationCard.set(undefined);
    this.loadFoundationCards(card);
  }

  onFoundationCardSelected(card: CardData): void {
    this.selectedFoundationCard.set(card);
    const path = this.selectedPath();
    if (path) {
      this.emitChoice({ type: 'MULTICLASS', subclassCardId: card.id });
    }
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
    const classIds = new Set(
      sheet.subclassCards
        .map(c => c.associatedClassId)
        .filter((id): id is number => id != null)
    );

    if (classIds.size === 0) return;
    this.subclassCardsLoading.set(true);

    const classId = [...classIds][0];
    this.subclassService.getSubclasses(classId).subscribe({
      next: cards => {
        const currentPathNames = new Set(
          sheet.subclassCards
            .map(c => c.subclassPathName)
            .filter((name): name is string => name != null)
        );
        const filtered = cards.filter(c => {
          const pathName = c.metadata?.['subclassPathName'] as string;
          return pathName && currentPathNames.has(pathName);
        });
        this.subclassCards.set(filtered);
        this.subclassCardsLoading.set(false);
      },
      error: () => this.subclassCardsLoading.set(false),
    });
  }

  private loadSubclassPaths(): void {
    this.subclassPathsLoading.set(true);
    this.subclassPathService.getSubclassPaths().subscribe({
      next: paths => {
        const existingClassNames = new Set(this.characterSheet().subclassCards.map(c => c.associatedClassName));
        const filtered = paths.filter(p => {
          const className = p.metadata?.['associatedClassName'] as string;
          return className && !existingClassNames.has(className);
        });
        this.subclassPaths.set(filtered);
        this.subclassPathsLoading.set(false);
      },
      error: () => this.subclassPathsLoading.set(false),
    });
  }

  private loadFoundationCards(path: CardData): void {
    const classId = path.metadata?.['associatedClassId'] as number;
    if (!classId) return;

    this.foundationCardsLoading.set(true);
    this.subclassService.getSubclasses(classId).subscribe({
      next: cards => {
        const pathName = path.name;
        const filtered = cards.filter(c => {
          const level = c.metadata?.['level'] as string;
          const subclassPathName = c.metadata?.['subclassPathName'] as string;
          return level === 'Foundation' && subclassPathName === pathName;
        });
        this.foundationCards.set(filtered);
        this.foundationCardsLoading.set(false);
      },
      error: () => this.foundationCardsLoading.set(false),
    });
  }
}
