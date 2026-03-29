import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, forkJoin, of, map, Observable } from 'rxjs';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { SubclassPathSelector } from '../../shared/components/subclass-path-selector/subclass-path-selector';
import { CardSelectionGrid } from '../../shared/components/card-selection-grid/card-selection-grid';
import { CardSkeleton } from '../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../shared/components/card-error/card-error';
import { AncestrySelector, MixedAncestrySelection } from './components/ancestry-selector/ancestry-selector';
import { CHARACTER_TABS, CharacterSelections, TabId } from './models/create-character.model';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { ClassService } from '../../shared/services/class.service';
import { SubclassService } from '../../shared/services/subclass.service';
import { AncestryService } from '../../shared/services/ancestry.service';
import { CommunityService } from '../../shared/services/community.service';
import { DomainService } from '../../shared/services/domain.service';
import { TraitSelector } from './components/trait-selector/trait-selector';
import { WeaponSection } from './components/equipment-selector/components/weapon-section/weapon-section';
import { ArmorSection } from './components/equipment-selector/components/armor-section/armor-section';
import { ExperienceSelector } from './components/experience-selector/experience-selector';
import { ReviewSection } from './components/review-section/review-section';
import { TraitAssignments, TraitKey } from './models/trait.model';
import { Experience, isExperienceComplete } from './models/experience.model';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { CharacterSheetResponse } from './models/character-sheet-api.model';
import { CharacterSheetData } from './models/character-sheet.model';
import { assembleCharacterSheet } from './utils/character-sheet-assembler.utils';
import { toCreateCharacterSheetRequest } from './utils/character-sheet-submission.utils';
import { SubmitError, parseSubmitError } from './models/submit-error.model';

@Component({
  selector: 'app-create-character',
  imports: [TabNav, CharacterForm, SubclassPathSelector, CardSelectionGrid, CardSkeleton, CardError, AncestrySelector, TraitSelector, WeaponSection, ArmorSection, ExperienceSelector, ReviewSection],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCharacter implements OnInit {
  private readonly classService = inject(ClassService);
  private readonly subclassService = inject(SubclassService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);
  private readonly domainService = inject(DomainService);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly router = inject(Router);

  readonly tabs = CHARACTER_TABS;
  readonly activeTab = signal<TabId>('class');
  private readonly selectedCards = signal<Partial<Record<TabId, CardData>>>({});
  private readonly completedStepsSignal = signal<Set<TabId>>(new Set());

  readonly completedSteps = this.completedStepsSignal.asReadonly();

  readonly classCards = signal<CardData[]>([]);
  readonly classCardsLoading = signal(true);
  readonly classCardsError = signal(false);

  readonly subclassCards = signal<CardData[]>([]);
  readonly subclassCardsLoading = signal(false);
  readonly subclassCardsError = signal(false);
  private lastLoadedClassId: number | null = null;

  readonly ancestryCards = signal<CardData[]>([]);
  readonly ancestryCardsLoading = signal(false);
  readonly ancestryCardsError = signal(false);

  readonly communityCards = signal<CardData[]>([]);
  readonly communityCardsLoading = signal(false);
  readonly communityCardsError = signal(false);

  readonly domainCards = signal<CardData[]>([]);
  readonly domainCardsLoading = signal(false);
  readonly domainCardsError = signal(false);
  readonly selectedDomainCards = signal<CardData[]>([]);
  private lastLoadedDomainSubclassId: number | null = null;

  readonly traitAssignments = signal<TraitAssignments | null>(null);
  readonly experienceAssignments = signal<Experience[]>([]);
  readonly selectedPrimaryWeapon = signal<CardData | null>(null);
  readonly selectedSecondaryWeapon = signal<CardData | null>(null);
  readonly selectedArmor = signal<CardData | null>(null);

  readonly characterName = signal('');
  readonly characterPronouns = signal('');
  readonly submitting = signal(false);
  readonly submitError = signal<SubmitError | null>(null);
  readonly mixedAncestrySelection = signal<MixedAncestrySelection | null>(null);

  readonly selectedClassCard = computed(() => this.selectedCards()['class']);
  readonly selectedSubclassCard = computed(() => this.selectedCards()['subclass']);
  readonly selectedAncestryCard = computed(() => this.selectedCards()['ancestry']);
  readonly selectedCommunityCard = computed(() => this.selectedCards()['community']);

  readonly subclassHasMagicAccess = computed(() =>
    this.selectedSubclassCard()?.metadata?.['spellcastingTrait'] != null,
  );

  readonly characterSelections = computed<CharacterSelections>(() => {
    const cards = this.selectedCards();
    const domainCardNames = this.selectedDomainCards();
    return {
      class: cards['class']?.name,
      subclass: cards['subclass']?.name,
      domains: cards['subclass']?.subtitle,
      ancestry: cards['ancestry']?.name,
      community: cards['community']?.name,
      traits: this.formatTraitSummary(),
      weapon: this.formatWeaponSummary(),
      armor: this.selectedArmor()?.name,
      domainCards: domainCardNames.length > 0 ? domainCardNames.map(c => c.name).join(', ') : undefined,
    };
  });

  ngOnInit(): void {
    this.loadClassCards();
  }

  onTabSelected(tabId: TabId): void {
    if (this.isTabReachable(tabId)) {
      this.activeTab.set(tabId);
      if (tabId === 'subclass') {
        this.loadSubclassCards();
      }
      if (tabId === 'ancestry') {
        this.loadAncestryCards();
      }
      if (tabId === 'community') {
        this.loadCommunityCards();
      }
      if (tabId === 'starting-weapon') {
        this.markStepComplete('starting-weapon');
      }
      if (tabId === 'starting-armor') {
        this.markStepComplete('starting-armor');
      }
      if (tabId === 'domain-cards') {
        this.loadDomainCards();
      }
      if (tabId === 'review') {
        this.markStepComplete('review');
      }
    }
  }

  onCardClicked(card: CardData): void {
    const currentTab = this.activeTab();
    const cards = this.selectedCards();
    const isDeselecting = cards[currentTab]?.id === card.id;

    if (isDeselecting) {
      const updated = { ...cards };
      delete updated[currentTab];
      this.selectedCards.set(updated);
      this.invalidateSteps(currentTab, true);
    } else {
      const previousCard = cards[currentTab];
      this.selectedCards.set({ ...cards, [currentTab]: card });
      this.markStepComplete(currentTab);

      if (currentTab === 'class' && previousCard && previousCard.id !== card.id) {
        this.invalidateSteps(currentTab, false);
      }

      if (currentTab === 'subclass' && previousCard && previousCard.id !== card.id) {
        this.clearDomainCardSelections();
      }
    }
  }

  onMixedAncestrySelected(selection: MixedAncestrySelection): void {
    this.mixedAncestrySelection.set(selection);
    const tempCard: CardData = {
      id: -1,
      name: `${selection.ancestry1.name} / ${selection.ancestry2.name}`,
      description: `A blend of ${selection.ancestry1.name} and ${selection.ancestry2.name} heritage.`,
      cardType: 'ancestry',
      features: [selection.feature1, selection.feature2],
      metadata: { isMixed: true },
    };
    this.selectedCards.set({ ...this.selectedCards(), ancestry: tempCard });
    this.markStepComplete('ancestry');
  }

  onAncestryDeselected(): void {
    const updated = { ...this.selectedCards() };
    delete updated['ancestry'];
    this.selectedCards.set(updated);
    this.mixedAncestrySelection.set(null);
    this.invalidateSteps('ancestry', true);
  }

  loadSubclassCards(): void {
    const classCard = this.selectedCards()['class'];
    if (!classCard) return;

    const classId = classCard.id;

    if (classId === this.lastLoadedClassId && this.subclassCards().length > 0) {
      return;
    }

    this.subclassCardsLoading.set(true);
    this.subclassCardsError.set(false);

    this.subclassService.getSubclasses(classId).subscribe({
      next: (cards) => {
        this.subclassCards.set(cards);
        this.subclassCardsLoading.set(false);
        this.lastLoadedClassId = classId;
      },
      error: () => {
        this.subclassCardsError.set(true);
        this.subclassCardsLoading.set(false);
      },
    });
  }

  loadAncestryCards(): void {
    if (this.ancestryCards().length > 0) {
      return;
    }

    this.ancestryCardsLoading.set(true);
    this.ancestryCardsError.set(false);

    this.ancestryService.getAncestries().subscribe({
      next: (cards) => {
        this.ancestryCards.set(cards);
        this.ancestryCardsLoading.set(false);
      },
      error: () => {
        this.ancestryCardsError.set(true);
        this.ancestryCardsLoading.set(false);
      },
    });
  }

  loadCommunityCards(): void {
    if (this.communityCards().length > 0) {
      return;
    }

    this.communityCardsLoading.set(true);
    this.communityCardsError.set(false);

    this.communityService.getCommunities().subscribe({
      next: (cards) => {
        this.communityCards.set(cards);
        this.communityCardsLoading.set(false);
      },
      error: () => {
        this.communityCardsError.set(true);
        this.communityCardsLoading.set(false);
      },
    });
  }

  loadDomainCards(): void {
    const subclass = this.selectedCards()['subclass'];
    if (!subclass) return;

    const subclassId = subclass.id;
    if (subclassId === this.lastLoadedDomainSubclassId && this.domainCards().length > 0) {
      return;
    }

    const domainNames = (subclass.metadata?.['domainNames'] as string[]) ?? [];
    if (domainNames.length === 0) return;

    this.domainCardsLoading.set(true);
    this.domainCardsError.set(false);

    this.domainService.getDomainCardsForNames(domainNames, [1]).subscribe({
      next: (cards) => {
        this.domainCards.set(cards);
        this.domainCardsLoading.set(false);
        this.lastLoadedDomainSubclassId = subclassId;
      },
      error: () => {
        this.domainCardsError.set(true);
        this.domainCardsLoading.set(false);
      },
    });
  }

  onDomainCardsSelected(cards: CardData[]): void {
    this.selectedDomainCards.set(cards);
    if (cards.length === 2) {
      this.markStepComplete('domain-cards');
    } else {
      const updated = new Set(this.completedStepsSignal());
      updated.delete('domain-cards');
      this.completedStepsSignal.set(updated);
    }
  }

  private clearDomainCardSelections(): void {
    this.selectedDomainCards.set([]);
    this.domainCards.set([]);
    this.lastLoadedDomainSubclassId = null;
    const updated = new Set(this.completedStepsSignal());
    updated.delete('domain-cards');
    this.completedStepsSignal.set(updated);
  }

  onWeaponSelected(selection: { primary: CardData | null; secondary: CardData | null }): void {
    this.selectedPrimaryWeapon.set(selection.primary);
    this.selectedSecondaryWeapon.set(selection.secondary);
    this.markStepComplete('starting-weapon');
  }

  onArmorSelected(armor: CardData | null): void {
    this.selectedArmor.set(armor);
    this.markStepComplete('starting-armor');
  }

  onExperiencesChanged(experiences: Experience[]): void {
    this.experienceAssignments.set(experiences);
    const hasComplete = experiences.some(exp => isExperienceComplete(exp));
    if (hasComplete) {
      this.markStepComplete('experiences');
    } else {
      const updated = new Set(this.completedStepsSignal());
      updated.delete('experiences');
      this.completedStepsSignal.set(updated);
    }
  }

  onTraitsChanged(assignments: TraitAssignments): void {
    this.traitAssignments.set(assignments);
    const isComplete = Object.values(assignments).every((v) => v !== null);
    if (isComplete) {
      this.markStepComplete('traits');
    } else {
      const updated = new Set(this.completedStepsSignal());
      updated.delete('traits');
      this.completedStepsSignal.set(updated);
    }
  }

  private formatTraitSummary(): string | undefined {
    const assignments = this.traitAssignments();
    if (!assignments) return undefined;
    const entries = Object.entries(assignments).filter(([, v]) => v !== null) as [TraitKey, number][];
    if (entries.length === 0) return undefined;
    const abbrevs: Record<TraitKey, string> = {
      agility: 'AGI',
      strength: 'STR',
      finesse: 'FIN',
      instinct: 'INS',
      presence: 'PRE',
      knowledge: 'KNO',
    };
    return entries
      .map(([key, val]) => `${abbrevs[key]} ${val > 0 ? '+' : ''}${val}`)
      .join(', ');
  }

  private formatWeaponSummary(): string | undefined {
    const primary = this.selectedPrimaryWeapon();
    if (!primary) return undefined;
    const weapons = [primary.name];
    const secondary = this.selectedSecondaryWeapon();
    if (secondary) weapons.push(secondary.name);
    return weapons.join(' + ');
  }

  onCharacterNameChanged(name: string): void {
    this.characterName.set(name);
  }

  onCharacterPronounsChanged(pronouns: string): void {
    this.characterPronouns.set(pronouns);
  }

  onSubmitCharacter(): void {
    this.submitting.set(true);
    this.submitError.set(null);

    const mixedSelection = this.mixedAncestrySelection();

    const ancestryCard$ = mixedSelection
      ? this.ancestryService.createMixedAncestry({
          name: `${mixedSelection.ancestry1.name} / ${mixedSelection.ancestry2.name}`,
          description: `A blend of ${mixedSelection.ancestry1.name} and ${mixedSelection.ancestry2.name} heritage.`,
          expansionId: mixedSelection.expansionId,
          featureIds: [mixedSelection.feature1.id!, mixedSelection.feature2.id!],
        })
      : of(this.selectedAncestryCard()!);

    ancestryCard$.pipe(
      switchMap(ancestryCard => {
        const characterData = assembleCharacterSheet({
          name: this.characterName(),
          pronouns: this.characterPronouns(),
          classCard: this.selectedClassCard()!,
          subclassCard: this.selectedSubclassCard()!,
          ancestryCard,
          communityCard: this.selectedCommunityCard()!,
          traits: this.traitAssignments()!,
          primaryWeapon: this.selectedPrimaryWeapon(),
          secondaryWeapon: this.selectedSecondaryWeapon(),
          armor: this.selectedArmor(),
          experiences: this.experienceAssignments(),
          domainCards: this.selectedDomainCards(),
        });
        return this.submitCharacterSheet(characterData);
      }),
    ).subscribe({
      next: (sheet) => {
        this.submitting.set(false);
        this.router.navigate(['/character', sheet.id]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.submitError.set(parseSubmitError(err));
      },
    });
  }

  private submitCharacterSheet(data: CharacterSheetData): Observable<CharacterSheetResponse> {
    const request = toCreateCharacterSheetRequest(data);

    return this.characterSheetService.createCharacterSheet(request).pipe(
      switchMap(sheet => {
        if (data.experiences.length === 0) {
          return of(sheet);
        }

        const experienceRequests = data.experiences.map(exp =>
          this.characterSheetService.createExperience({
            characterSheetId: sheet.id,
            description: exp.name,
            modifier: exp.modifier,
          }),
        );

        return forkJoin(experienceRequests).pipe(map(() => sheet));
      }),
    );
  }

  private loadClassCards(): void {
    this.classCardsLoading.set(true);
    this.classCardsError.set(false);

    this.classService.getClasses().subscribe({
      next: (cards) => {
        this.classCards.set(cards);
        this.classCardsLoading.set(false);
      },
      error: () => {
        this.classCardsError.set(true);
        this.classCardsLoading.set(false);
      },
    });
  }

  private markStepComplete(tabId: TabId): void {
    const updated = new Set(this.completedStepsSignal());
    updated.add(tabId);
    this.completedStepsSignal.set(updated);
  }

  private invalidateSteps(fromTabId: TabId, inclusive: boolean): void {
    const tabIndex = this.tabs.findIndex((t) => t.id === fromTabId);
    const startIndex = inclusive ? tabIndex : tabIndex + 1;
    const updatedSteps = new Set(this.completedStepsSignal());
    const updatedCards = { ...this.selectedCards() };

    for (let i = startIndex; i < this.tabs.length; i++) {
      updatedSteps.delete(this.tabs[i].id);
      delete updatedCards[this.tabs[i].id];
    }

    this.completedStepsSignal.set(updatedSteps);
    this.selectedCards.set(updatedCards);
  }

  private isTabReachable(tabId: TabId): boolean {
    const targetIndex = this.tabs.findIndex((t) => t.id === tabId);
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTab());

    if (targetIndex <= currentIndex) return true;

    for (let i = 0; i < targetIndex; i++) {
      if (!this.completedStepsSignal().has(this.tabs[i].id)) return false;
    }
    return true;
  }
}
