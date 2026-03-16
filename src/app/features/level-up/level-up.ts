import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { mapToCharacterSheetView } from '../character-sheet/utils/character-sheet-view.mapper';
import { CharacterSheetView } from '../character-sheet/models/character-sheet-view.model';
import { LevelUpOptionsResponse, AdvancementChoice, AvailableAdvancement, DomainCardTradeRequest } from './models/level-up-api.model';
import { LevelUpTab, LevelUpTabId } from './models/level-up.model';
import { computeVisibleTabs } from './utils/level-up-steps.utils';
import { assembleLevelUpRequest } from './utils/level-up-request-assembler.utils';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';

import { LevelUpTabNav } from './components/level-up-tab-nav/level-up-tab-nav';
import { ConfirmDialog } from './components/confirm-dialog/confirm-dialog';
import { TierAchievementsStep } from './components/tier-achievements-step/tier-achievements-step';
import { AdvancementsStep } from './components/advancements-step/advancements-step';
import { DomainCardStep } from './components/domain-card-step/domain-card-step';
import { DomainTradeStep } from './components/domain-trade-step/domain-trade-step';
import { LevelUpReview } from './components/level-up-review/level-up-review';

@Component({
  selector: 'app-level-up',
  imports: [LevelUpTabNav, ConfirmDialog, TierAchievementsStep, AdvancementsStep, DomainCardStep, DomainTradeStep, LevelUpReview],
  templateUrl: './level-up.html',
  styleUrl: './level-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelUp implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly characterSheet = signal<CharacterSheetView | null>(null);
  private readonly rawSheet = signal<CharacterSheetResponse | null>(null);
  readonly levelUpOptions = signal<LevelUpOptionsResponse | null>(null);

  readonly visibleTabs = signal<LevelUpTab[]>([]);
  readonly activeTab = signal<LevelUpTabId>('advancements');
  private readonly completedStepsSignal = signal<Set<LevelUpTabId>>(new Set());
  readonly completedSteps = this.completedStepsSignal.asReadonly();

  readonly newExperienceDescription = signal('');
  readonly selectedAdvancements = signal<AdvancementChoice[]>([]);
  readonly selectedDomainCards = signal<CardData[]>([]);
  readonly equipNewDomainCard = signal(false);
  readonly unequipDomainCardId = signal<number | undefined>(undefined);
  readonly trades = signal<DomainCardTradeRequest[]>([]);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly showLevelDownDialog = signal(false);
  readonly levelDownProcessing = signal(false);

  private characterId = 0;

  readonly isMaxLevel = computed(() => {
    const sheet = this.characterSheet();
    return sheet !== null && sheet.level >= 10;
  });

  readonly isMinLevel = computed(() => {
    const options = this.levelUpOptions();
    return options !== null && options.currentLevel <= 1;
  });

  readonly ownedDomainCardIds = computed(() => {
    const raw = this.rawSheet();
    return raw ? raw.domainCardIds : [];
  });

  readonly equippedDomainCards = computed(() => {
    const sheet = this.characterSheet();
    return sheet?.domainCards ?? [];
  });

  private static readonly TIER_3_ONLY_TYPES = new Set<string>(['UPGRADE_SUBCLASS', 'MULTICLASS']);

  readonly filteredAdvancements = computed<AvailableAdvancement[]>(() => {
    const options = this.levelUpOptions();
    if (!options) return [];
    if (options.nextLevel >= 5) return options.availableAdvancements;
    return options.availableAdvancements.filter(a => !LevelUp.TIER_3_ONLY_TYPES.has(a.type));
  });

  readonly domainCardMaxSelections = computed(() => {
    const hasGainDomainCard = this.selectedAdvancements().some(a => a.type === 'GAIN_DOMAIN_CARD');
    return hasGainDomainCard ? 2 : 1;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      this.error.set('Invalid character ID.');
      this.loading.set(false);
      return;
    }
    this.characterId = id;
    this.loadData(id);
  }

  onTabSelected(tabId: LevelUpTabId): void {
    this.activeTab.set(tabId);
    if (tabId === 'domain-trades') {
      this.markStepComplete('domain-trades');
    }
  }

  onExperienceDescriptionChanged(description: string): void {
    this.newExperienceDescription.set(description);
    if (description.trim().length > 0) {
      this.markStepComplete('tier-achievements');
    } else {
      this.removeStepComplete('tier-achievements');
    }
  }

  onAdvancementsChanged(advancements: AdvancementChoice[]): void {
    this.selectedAdvancements.set(advancements);
    if (advancements.length === 2) {
      this.markStepComplete('advancements');
    } else {
      this.removeStepComplete('advancements');
    }
  }

  onDomainCardsSelected(cards: CardData[]): void {
    this.selectedDomainCards.set(cards);
    const required = this.domainCardMaxSelections();
    if (cards.length >= required) {
      this.markStepComplete('domain-card');
    } else {
      this.removeStepComplete('domain-card');
    }
  }

  onEquipChanged(equip: boolean): void {
    this.equipNewDomainCard.set(equip);
  }

  onUnequipCardIdChanged(cardId: number | undefined): void {
    this.unequipDomainCardId.set(cardId);
  }

  onTradesChanged(trades: DomainCardTradeRequest[]): void {
    this.trades.set(trades);
    this.markStepComplete('domain-trades');
  }

  onSubmit(): void {
    const options = this.levelUpOptions();
    const domainCards = this.selectedDomainCards();
    if (!options || domainCards.length === 0) return;

    const advancements = this.selectedAdvancements().map(a => {
      if (a.type === 'GAIN_DOMAIN_CARD' && domainCards.length > 1) {
        return { ...a, domainCardId: domainCards[1].id, equipDomainCard: this.equipNewDomainCard() };
      }
      return a;
    });

    const request = assembleLevelUpRequest({
      advancements,
      newExperienceDescription: (options.tierTransition || options.currentTier !== options.nextTier) ? this.newExperienceDescription() : undefined,
      newDomainCardId: domainCards[0].id,
      equipNewDomainCard: this.equipNewDomainCard(),
      unequipDomainCardId: this.unequipDomainCardId(),
      trades: this.trades(),
    });

    this.submitting.set(true);
    this.submitError.set(null);

    this.characterSheetService.levelUp(this.characterId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/character', this.characterId]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(
          (err.error?.message as string | undefined) ?? 'Failed to level up. Please try again.',
        );
      },
    });
  }

  onLevelDownClick(): void {
    this.showLevelDownDialog.set(true);
  }

  onLevelDownConfirm(): void {
    this.levelDownProcessing.set(true);
    this.characterSheetService.undoLevelUp(this.characterId).subscribe({
      next: () => {
        this.levelDownProcessing.set(false);
        this.showLevelDownDialog.set(false);
        this.router.navigate(['/character', this.characterId]);
      },
      error: () => {
        this.levelDownProcessing.set(false);
      },
    });
  }

  onLevelDownCancel(): void {
    this.showLevelDownDialog.set(false);
  }

  private loadData(id: number): void {
    const expandFields = [
      'experiences', 'subclassCards', 'domainCards',
      'features', 'costTags',
    ];

    forkJoin({
      sheet: this.characterSheetService.getCharacterSheet(id, expandFields),
      options: this.characterSheetService.getLevelUpOptions(id),
    }).subscribe({
      next: ({ sheet, options }) => {
        const user = this.authService.user();
        if (user && sheet.ownerId !== user.id) {
          this.error.set('You do not own this character.');
          this.loading.set(false);
          return;
        }

        this.rawSheet.set(sheet);
        this.characterSheet.set(mapToCharacterSheetView(sheet));
        this.levelUpOptions.set(options);

        const tabs = computeVisibleTabs(options);
        this.visibleTabs.set(tabs);
        this.activeTab.set(tabs[0].id);

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load level-up data.');
        this.loading.set(false);
      },
    });
  }

  private markStepComplete(tabId: LevelUpTabId): void {
    const updated = new Set(this.completedStepsSignal());
    updated.add(tabId);
    this.completedStepsSignal.set(updated);
  }

  private removeStepComplete(tabId: LevelUpTabId): void {
    const updated = new Set(this.completedStepsSignal());
    updated.delete(tabId);
    this.completedStepsSignal.set(updated);
  }
}
