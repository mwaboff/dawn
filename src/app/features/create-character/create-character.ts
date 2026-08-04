import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, forkJoin, of, map, tap, Observable } from 'rxjs';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { SubclassPathSelector } from '../../shared/components/subclass-path-selector/subclass-path-selector';
import { CardSelectionGrid } from '../../shared/components/card-selection-grid/card-selection-grid';
import { CardSkeleton } from '../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../shared/components/card-error/card-error';
import { AncestrySelector, MixedAncestrySelection } from './components/ancestry-selector/ancestry-selector';
import { MartialStanceSelector, REQUIRED_STANCE_COUNT } from './components/martial-stance-selector/martial-stance-selector';
import { CHARACTER_TABS, CharacterSelections, Tab, TabId } from './models/create-character.model';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { ClassService } from '../../shared/services/class.service';
import { SubclassService } from '../../shared/services/subclass.service';
import { AncestryService } from '../../shared/services/ancestry.service';
import { CommunityService } from '../../shared/services/community.service';
import { DomainService } from '../../shared/services/domain.service';
import { MartialStanceService } from '../../shared/services/martial-stance.service';
import { mapMartialStanceToCardData } from '../../shared/mappers/martial-stance.mapper';
import { hasMartialStances } from '../character-sheet/utils/martial-stance-access.utils';
import { hasCompanionFeature } from '../character-sheet/utils/companion-access.utils';
import { TraitSelector } from './components/trait-selector/trait-selector';
import { WeaponSection } from './components/equipment-selector/components/weapon-section/weapon-section';
import { ArmorSection } from './components/equipment-selector/components/armor-section/armor-section';
import { ExperienceSelector } from '../../shared/components/experience-selector/experience-selector';
import { ExperienceBonusAllocator } from './components/experience-bonus-allocator/experience-bonus-allocator';
import { ReviewSection } from './components/review-section/review-section';
import { CompanionCreator } from './components/companion-creator/companion-creator';
import { TraitAssignments, TraitKey } from './models/trait.model';
import { Experience, isExperienceComplete } from '../../shared/models/experience.model';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { CompanionService } from '../../shared/services/companion.service';
import { CharacterSheetResponse, ModifierResponse } from './models/character-sheet-api.model';
import { CharacterSheetData } from './models/character-sheet.model';
import { CompanionDraft } from './models/companion-draft.model';
import { assembleCharacterSheet } from './utils/character-sheet-assembler.utils';
import { toCreateCharacterSheetRequest } from './utils/character-sheet-submission.utils';
import { isCompanionDraftReady } from './utils/companion-draft.utils';
import { SubmitError, parseSubmitError } from './models/submit-error.model';
import { SubclassFeatureResponse } from '../../shared/models/subclass-api.model';
import { sumFeatureModifier } from '../../shared/utils/feature-modifier.utils';

interface FeatureWithModifiers {
  modifiers?: readonly ModifierResponse[];
}

@Component({
  selector: 'app-create-character',
  imports: [TabNav, CharacterForm, SubclassPathSelector, CardSelectionGrid, CardSkeleton, CardError, AncestrySelector, MartialStanceSelector, TraitSelector, WeaponSection, ArmorSection, ExperienceSelector, ExperienceBonusAllocator, ReviewSection, CompanionCreator],
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
  private readonly martialStanceService = inject(MartialStanceService);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly companionService = inject(CompanionService);
  private readonly router = inject(Router);

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

  readonly martialStanceCards = signal<CardData[]>([]);
  readonly martialStanceCardsLoading = signal(false);
  readonly martialStanceCardsError = signal(false);
  readonly selectedMartialStances = signal<CardData[]>([]);

  readonly traitAssignments = signal<TraitAssignments | null>(null);
  readonly experienceAssignments = signal<Experience[]>([]);
  readonly selectedPrimaryWeapon = signal<CardData | null>(null);
  readonly selectedSecondaryWeapon = signal<CardData | null>(null);
  readonly selectedArmor = signal<CardData | null>(null);

  readonly characterName = signal('');
  readonly characterPronouns = signal('');
  readonly submitting = signal(false);
  readonly submitError = signal<SubmitError | null>(null);
  /**
   * The sheet returned by a successful create. Guards the two-phase submit: if the follow-up
   * stance PUT fails, resubmitting must NOT create a second character.
   */
  private readonly createdSheet = signal<CharacterSheetResponse | null>(null);
  readonly mixedAncestrySelection = signal<MixedAncestrySelection | null>(null);

  readonly selectedClassCard = computed(() => this.selectedCards()['class']);
  readonly selectedSubclassCard = computed(() => this.selectedCards()['subclass']);
  readonly selectedAncestryCard = computed(() => this.selectedCards()['ancestry']);
  readonly selectedCommunityCard = computed(() => this.selectedCards()['community']);

  readonly subclassHasMagicAccess = computed(() =>
    this.selectedSubclassCard()?.metadata?.['spellcastingTrait'] != null,
  );

  /**
   * True when the selected subclass grants "Stance Fighter" (Martial Artist's foundation
   * feature). Reuses `hasMartialStances` -- the same predicate the character sheet uses to show
   * the martial-stance panel -- rather than duplicating the feature-name check here. The
   * predicate expects an array of subclass-card-shaped objects with a `features` array; the
   * cast below satisfies that shape from the subclass `CardData`'s raw feature metadata without
   * introducing a second copy of the rule.
   */
  readonly showMartialStanceStep = computed<boolean>(() => {
    const subclass = this.selectedSubclassCard();
    if (!subclass) return false;
    const features = subclass.metadata?.['features'] as SubclassFeatureResponse[] | undefined;
    return hasMartialStances([{ features }] as Parameters<typeof hasMartialStances>[0]);
  });

  /**
   * True when the selected subclass grants the Beastbound Ranger's "Companion" foundation
   * feature. Reuses `hasCompanionFeature` -- the same predicate the character sheet and level-up
   * flow use -- via the same "wrap the raw feature array and cast" approach `showMartialStanceStep`
   * above already uses to bridge `CardData.metadata['features']`'s shape to the utility's expected
   * subclass-card shape.
   */
  readonly showCompanionStep = computed<boolean>(() => {
    const subclass = this.selectedSubclassCard();
    if (!subclass) return false;
    const features = subclass.metadata?.['features'] as SubclassFeatureResponse[] | undefined;
    return hasCompanionFeature([{ features }] as Parameters<typeof hasCompanionFeature>[0]);
  });

  readonly companionDraft = signal<CompanionDraft | null>(null);

  private static readonly CREATION_BASE_DOMAIN_CARDS = 2;

  readonly bonusDomainCardSlots = computed<number>(() => {
    const subclass = this.selectedSubclassCard();
    const features = subclass?.metadata?.['features'] as SubclassFeatureResponse[] | undefined;
    return sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS');
  });

  readonly domainCardMaxSelections = computed<number>(() =>
    CreateCharacter.CREATION_BASE_DOMAIN_CARDS + this.bonusDomainCardSlots(),
  );

  readonly experienceBonusAllocations = signal<number[]>([]);

  readonly effectiveExperiences = computed<Experience[]>(() => {
    const allocations = this.experienceBonusAllocations();
    return this.experienceAssignments().map((exp, i) => ({
      name: exp.name,
      modifier: (exp.modifier ?? 0) + (allocations[i] ?? 0),
    }));
  });

  readonly experienceBonusPoints = computed<number>(() => {
    const sourceFeatures: FeatureWithModifiers[] = [];
    const subclass = this.selectedSubclassCard();
    const ancestry = this.selectedAncestryCard();
    const community = this.selectedCommunityCard();
    const subFeatures = subclass?.metadata?.['features'] as SubclassFeatureResponse[] | undefined;
    const ancFeatures = ancestry?.metadata?.['features'] as FeatureWithModifiers[] | undefined;
    const comFeatures = community?.metadata?.['features'] as FeatureWithModifiers[] | undefined;
    if (subFeatures) sourceFeatures.push(...subFeatures);
    if (ancFeatures) sourceFeatures.push(...ancFeatures);
    if (comFeatures) sourceFeatures.push(...comFeatures);
    for (const card of this.selectedDomainCards()) {
      const dcFeatures = card.metadata?.['features'] as FeatureWithModifiers[] | undefined;
      if (dcFeatures) sourceFeatures.push(...dcFeatures);
    }
    return sumFeatureModifier(sourceFeatures, 'BONUS_EXPERIENCE_MODIFIER');
  });

  readonly tabs = computed<Tab[]>(() => {
    const showBonuses = this.experienceBonusPoints() > 0;
    const showMartialStances = this.showMartialStanceStep();
    const showCompanion = this.showCompanionStep();
    return CHARACTER_TABS.filter(t =>
      (showBonuses || t.id !== 'bonuses') &&
      (showMartialStances || t.id !== 'martial-stances') &&
      (showCompanion || t.id !== 'companion'),
    );
  });

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
      if (tabId === 'martial-stances') {
        this.loadMartialStanceCards();
      }
      if (tabId === 'ancestry') {
        this.loadAncestryCards();
      }
      if (tabId === 'community') {
        this.loadCommunityCards();
      }
      if (tabId === 'companion') {
        // The Companion step is always skippable (companions plan §1/§6.5, "at the GM's
        // discretion") -- mark it complete the moment it's visited, the same way
        // starting-weapon/starting-armor below are marked complete regardless of whether the
        // player actually picks anything, rather than gating on `companionDraft` being non-null.
        this.markStepComplete('companion');
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
        this.clearMartialStanceSelections();
        this.clearCompanionDraft();
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
      metadata: {
        isMixed: true,
        features: [selection.feature1Raw, selection.feature2Raw].filter(f => f !== undefined),
      },
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

  loadMartialStanceCards(): void {
    if (this.martialStanceCards().length > 0) {
      return;
    }

    this.martialStanceCardsLoading.set(true);
    this.martialStanceCardsError.set(false);

    this.martialStanceService.getAllMartialStances().subscribe({
      next: (stances) => {
        this.martialStanceCards.set(stances.map(mapMartialStanceToCardData));
        this.martialStanceCardsLoading.set(false);
      },
      error: () => {
        this.martialStanceCardsError.set(true);
        this.martialStanceCardsLoading.set(false);
      },
    });
  }

  onMartialStancesSelected(cards: CardData[]): void {
    this.selectedMartialStances.set(cards);
    if (cards.length === REQUIRED_STANCE_COUNT) {
      this.markStepComplete('martial-stances');
    } else {
      const updated = new Set(this.completedStepsSignal());
      updated.delete('martial-stances');
      this.completedStepsSignal.set(updated);
    }
  }

  private clearMartialStanceSelections(): void {
    this.selectedMartialStances.set([]);
    const updated = new Set(this.completedStepsSignal());
    updated.delete('martial-stances');
    this.completedStepsSignal.set(updated);
  }

  onCompanionDraftChanged(draft: CompanionDraft | null): void {
    this.companionDraft.set(draft);
  }

  /** A player who picks Beastbound, drafts a companion, then switches to a different subclass
   * must not carry a phantom companion into submission -- mirrors `clearMartialStanceSelections`. */
  private clearCompanionDraft(): void {
    this.companionDraft.set(null);
  }

  onDomainCardsSelected(cards: CardData[]): void {
    this.selectedDomainCards.set(cards);
    this.experienceBonusAllocations.set([]);
    const completed = new Set(this.completedStepsSignal());
    completed.delete('bonuses');
    if (cards.length === this.domainCardMaxSelections()) {
      completed.add('domain-cards');
    } else {
      completed.delete('domain-cards');
    }
    this.completedStepsSignal.set(completed);
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

  onExperienceBonusesChanged(allocations: number[]): void {
    this.experienceBonusAllocations.set(allocations);
    const used = allocations.reduce((s, n) => s + n, 0);
    if (used === this.experienceBonusPoints() && used > 0) {
      this.markStepComplete('bonuses');
    } else {
      const updated = new Set(this.completedStepsSignal());
      updated.delete('bonuses');
      this.completedStepsSignal.set(updated);
    }
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

    const allCards = this.selectedDomainCards();
    const baseCount = CreateCharacter.CREATION_BASE_DOMAIN_CARDS;
    const effectiveExperiences = this.effectiveExperiences();

    // Creation and the stance attach are two calls. If creation lands but the stance PUT fails,
    // the sheet ALREADY exists -- resubmitting would create a duplicate character. So remember the
    // created sheet and, on retry, resume from the stance PUT instead of creating again.
    const alreadyCreated = this.createdSheet();
    const creation$ = alreadyCreated
      ? of(alreadyCreated)
      : ancestryCard$.pipe(
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
          experiences: effectiveExperiences,
          domainCards: allCards.slice(0, baseCount),
          bonusDomainCards: allCards.slice(baseCount),
        });
        return this.submitCharacterSheet(characterData);
      }),
      tap(sheet => this.createdSheet.set(sheet)),
    );

    creation$.pipe(
      switchMap(sheet => this.attachMartialStances(sheet)),
    ).subscribe({
      next: (sheet) => {
        this.submitting.set(false);
        this.router.navigate(['/character', sheet.id]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.submitError.set(
          this.createdSheet()
            ? { message: 'Your character was created, but the martial stances could not be saved. Submit again to retry saving them.' }
            : parseSubmitError(err),
        );
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
      switchMap(sheet => this.createCompanionFromDraft(sheet)),
    );
  }

  /**
   * Creates the companion drafted in the (skippable) Companion step, plus its starting
   * Experiences, using the just-created sheet's id. Folded into `submitCharacterSheet` -- not a
   * separate pipeline stage -- specifically so it is covered by the same `createdSheet`
   * re-submit guard as sheet/experience creation (see the comment on `alreadyCreated` in
   * `onSubmitCharacter`): if a *later* step (attaching martial stances) fails and the player
   * resubmits, `submitCharacterSheet` -- and this method with it -- never runs again, so the
   * companion is never created twice.
   */
  private createCompanionFromDraft(sheet: CharacterSheetResponse): Observable<CharacterSheetResponse> {
    const draft = this.companionDraft();
    if (!isCompanionDraftReady(draft)) {
      return of(sheet);
    }

    return this.companionService.createCompanion({
      ...draft.payload,
      characterSheetId: sheet.id,
    }).pipe(
      switchMap(companion => {
        const completeExperiences = draft.experiences.filter(isExperienceComplete);
        if (completeExperiences.length === 0) {
          return of(sheet);
        }

        const experienceRequests = completeExperiences.map(exp =>
          this.characterSheetService.createExperience({
            companionId: companion.id,
            description: exp.name,
            modifier: exp.modifier!,
          }),
        );

        return forkJoin(experienceRequests).pipe(map(() => sheet));
      }),
    );
  }

  /**
   * `CreateCharacterSheetRequest` has no field for known martial stances -- per the backend
   * contract, stances are set via a follow-up `PUT /character-sheets/{id}` with
   * `knownMartialStanceIds`, the same endpoint level-up uses to add one at a time.
   */
  private attachMartialStances(sheet: CharacterSheetResponse): Observable<CharacterSheetResponse> {
    const stances = this.selectedMartialStances();
    if (stances.length !== REQUIRED_STANCE_COUNT) {
      return of(sheet);
    }
    return this.characterSheetService.updateCharacterSheet(sheet.id, {
      knownMartialStanceIds: stances.map(c => c.id),
    });
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
    const tabs = this.tabs();
    const tabIndex = tabs.findIndex((t) => t.id === fromTabId);
    const startIndex = inclusive ? tabIndex : tabIndex + 1;
    const updatedSteps = new Set(this.completedStepsSignal());
    const updatedCards = { ...this.selectedCards() };

    for (let i = startIndex; i < tabs.length; i++) {
      updatedSteps.delete(tabs[i].id);
      delete updatedCards[tabs[i].id];
    }

    this.completedStepsSignal.set(updatedSteps);
    this.selectedCards.set(updatedCards);
    this.experienceBonusAllocations.set([]);
    this.clearMartialStanceSelections();
    this.clearCompanionDraft();
  }

  private isTabReachable(tabId: TabId): boolean {
    const tabs = this.tabs();
    const targetIndex = tabs.findIndex((t) => t.id === tabId);
    const currentIndex = tabs.findIndex((t) => t.id === this.activeTab());

    if (targetIndex <= currentIndex) return true;

    for (let i = 0; i < targetIndex; i++) {
      if (!this.completedStepsSignal().has(tabs[i].id)) return false;
    }
    return true;
  }
}
