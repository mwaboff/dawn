import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { SubclassPathSelector } from './components/subclass-path-selector/subclass-path-selector';
import { CardSelectionGrid } from '../../shared/components/card-selection-grid/card-selection-grid';
import { CardSkeleton } from '../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../shared/components/card-error/card-error';
import { CHARACTER_TABS, CharacterSelections, TabId } from './models/create-character.model';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { ClassService } from './services/class.service';
import { SubclassService } from './services/subclass.service';
import { AncestryService } from './services/ancestry.service';
import { CommunityService } from './services/community.service';
import { TraitSelector } from './components/trait-selector/trait-selector';
import { WeaponSection } from './components/equipment-selector/components/weapon-section/weapon-section';
import { ArmorSection } from './components/equipment-selector/components/armor-section/armor-section';
import { ExperienceSelector } from './components/experience-selector/experience-selector';
import { TraitAssignments, TraitKey } from './models/trait.model';
import { Experience, isExperienceComplete } from './models/experience.model';

@Component({
  selector: 'app-create-character',
  imports: [TabNav, CharacterForm, SubclassPathSelector, CardSelectionGrid, CardSkeleton, CardError, TraitSelector, WeaponSection, ArmorSection, ExperienceSelector],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCharacter implements OnInit {
  private readonly classService = inject(ClassService);
  private readonly subclassService = inject(SubclassService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);

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

  readonly traitAssignments = signal<TraitAssignments | null>(null);
  readonly experienceAssignments = signal<Experience[]>([]);
  readonly selectedPrimaryWeapon = signal<CardData | null>(null);
  readonly selectedSecondaryWeapon = signal<CardData | null>(null);
  readonly selectedArmor = signal<CardData | null>(null);

  readonly selectedClassCard = computed(() => this.selectedCards()['class']);
  readonly selectedSubclassCard = computed(() => this.selectedCards()['subclass']);
  readonly selectedAncestryCard = computed(() => this.selectedCards()['ancestry']);
  readonly selectedCommunityCard = computed(() => this.selectedCards()['community']);

  readonly subclassHasMagicAccess = computed(() =>
    this.selectedSubclassCard()?.metadata?.['spellcastingTrait'] != null,
  );

  readonly characterSelections = computed<CharacterSelections>(() => {
    const cards = this.selectedCards();
    return {
      class: cards['class']?.name,
      subclass: cards['subclass']?.name,
      domains: cards['subclass']?.subtitle,
      ancestry: cards['ancestry']?.name,
      community: cards['community']?.name,
      traits: this.formatTraitSummary(),
      weapon: this.formatWeaponSummary(),
      armor: this.selectedArmor()?.name,
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
    }
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
    if (tabId === 'domain-cards') return true;

    const targetIndex = this.tabs.findIndex((t) => t.id === tabId);
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTab());

    if (targetIndex <= currentIndex) return true;

    for (let i = 0; i < targetIndex; i++) {
      if (!this.completedStepsSignal().has(this.tabs[i].id)) return false;
    }
    return true;
  }
}
