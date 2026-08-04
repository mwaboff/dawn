import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap, tap, map, Observable } from 'rxjs';

import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanionService } from '../../shared/services/companion.service';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { mapToCharacterSheetView } from '../character-sheet/utils/character-sheet-view.mapper';
import { CharacterSheetView } from '../character-sheet/models/character-sheet-view.model';
import {
  LevelUpOptionsResponse,
  AdvancementChoice,
  AvailableAdvancement,
  DomainCardTradeRequest,
  TradeDisplayPair,
  CompanionTrainingEligibility,
  CompanionTrainingSelection,
  CompanionExperienceGrant,
} from './models/level-up-api.model';
import { LevelUpTab, LevelUpTabId, LevelUpTabKind } from './models/level-up.model';
import { computeVisibleTabs } from './utils/level-up-steps.utils';
import { assembleLevelUpRequest } from './utils/level-up-request-assembler.utils';
import { countBonusSlotsFromAdvancements } from './utils/bonus-domain-card.utils';
import { acquiresMartialStances } from './utils/acquires-martial-stances.utils';
import { acquiresCompanionFeature } from './utils/acquires-companion-feature.utils';
import { companionTrainingBonusPicks } from './utils/companion-training-bonus.utils';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { SubclassService } from '../../shared/services/subclass.service';
import { MartialStanceService } from '../../shared/services/martial-stance.service';
import { mapMartialStanceToCardData } from '../../shared/mappers/martial-stance.mapper';
import { hasMartialStances } from '../character-sheet/utils/martial-stance-access.utils';
import { hasCompanionFeature } from '../character-sheet/utils/companion-access.utils';
import { tierForLevel } from '../character-sheet/utils/beastform-access.utils';
import { CompanionApiResponse } from '../../shared/models/companion-api.model';
import { isExperienceComplete } from '../../shared/models/experience.model';
import { COMPANION_TRAINING_LABELS } from '../character-sheet/components/companion-panel/components/companion-training-list/companion-training-list.model';

import { LevelUpTabNav } from './components/level-up-tab-nav/level-up-tab-nav';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { TierAchievementsStep, CompanionExperienceTarget } from './components/tier-achievements-step/tier-achievements-step';
import { AdvancementsStep } from './components/advancements-step/advancements-step';
import { CompanionStep, CompanionStepSelection } from './components/companion-step/companion-step';
import { MartialStanceStep } from './components/martial-stance-step/martial-stance-step';
import { TrainingStep } from './components/training-step/training-step';
import { DomainCardStep } from './components/domain-card-step/domain-card-step';
import { DomainTradeStep, TradeRow } from './components/domain-trade-step/domain-trade-step';
import { LevelUpReview, CompanionReviewEntry } from './components/level-up-review/level-up-review';
import { AlsoHappeningBanner } from './components/also-happening-banner/also-happening-banner';

@Component({
  selector: 'app-level-up',
  imports: [
    LevelUpTabNav, ConfirmDialog, TierAchievementsStep, AdvancementsStep, CompanionStep, MartialStanceStep,
    TrainingStep, DomainCardStep, DomainTradeStep, LevelUpReview, AlsoHappeningBanner,
  ],
  templateUrl: './level-up.html',
  styleUrl: './level-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelUp implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly authService = inject(AuthService);
  private readonly subclassService = inject(SubclassService);
  private readonly martialStanceService = inject(MartialStanceService);
  private readonly companionService = inject(CompanionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly characterSheet = signal<CharacterSheetView | null>(null);
  private readonly rawSheet = signal<CharacterSheetResponse | null>(null);
  readonly levelUpOptions = signal<LevelUpOptionsResponse | null>(null);
  private readonly activeCompanions = signal<CompanionApiResponse[]>([]);

  readonly activeTab = signal<LevelUpTabId>('advancements');
  private readonly completedStepsSignal = signal<Set<LevelUpTabId>>(new Set());
  readonly completedSteps = this.completedStepsSignal.asReadonly();

  readonly newExperienceDescription = signal('');
  readonly selectedAdvancements = signal<AdvancementChoice[]>([]);
  readonly selectedDomainCards = signal<CardData[]>([]);
  readonly equipNewDomainCard = signal(false);
  readonly unequipDomainCardId = signal<number | undefined>(undefined);
  readonly trades = signal<DomainCardTradeRequest[]>([]);
  readonly tradeDisplayPairs = signal<TradeDisplayPair[]>([]);
  readonly tradeRow = signal<TradeRow | null>(null);
  readonly tradesSkipped = signal(false);

  readonly martialStanceCards = signal<CardData[]>([]);
  readonly martialStanceCardsLoading = signal(false);
  readonly martialStanceCardsError = signal(false);
  readonly selectedMartialStanceIds = signal<number[]>([]);

  readonly companionSelection = signal<CompanionStepSelection | null>(null);
  private readonly companionTrainingSelections = signal<Record<number, CompanionTrainingSelection[]>>({});
  private readonly companionExperienceGrants = signal<CompanionExperienceGrant[]>([]);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  /**
   * True once the level-up call has succeeded. Guards the two-phase submit: if the follow-up
   * stance PUT fails, resubmitting must NOT level the character a second time.
   */
  private readonly levelUpCompleted = signal(false);
  /**
   * Set once a brand-new companion has been created (phase 0, BEFORE the level-up call, since its
   * id must be sent inside the level-up request as `newCompanionId`). Guards against a double
   * create on retry: `resolveCompanionId` skips the create call entirely once this is set, the
   * same way `levelUpCompleted` guards phase 1. Restoring an existing companion needs no such
   * guard -- there is no create call to repeat, the backend restores it as part of applying the
   * level-up request itself.
   */
  private readonly companionCreatedId = signal<number | null>(null);
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

  readonly isTierTransition = computed(() => {
    const options = this.levelUpOptions();
    return !!options && (options.tierTransition || options.currentTier !== options.nextTier);
  });

  readonly ownedDomainCardIds = computed(() => {
    const raw = this.rawSheet();
    return raw ? raw.domainCardIds : [];
  });

  readonly equippedDomainCards = computed(() => {
    const sheet = this.characterSheet();
    return sheet?.domainCards ?? [];
  });

  /**
   * Recomputed from `showMartialStanceStep` (not fixed at load time) so the `martial-stance` tab
   * appears as soon as the player chooses a MULTICLASS/UPGRADE_SUBCLASS advancement that newly
   * grants Stance Fighter -- the advancements step comes before the martial-stance tab in
   * `ALL_LEVEL_UP_TABS`, so the tab must react to that choice, not just the character's
   * already-owned subclass cards. Same reactive treatment for `needsCompanionStep` and the
   * generated `training` tabs (one per `eligibleCompanionTrainings` entry).
   */
  readonly visibleTabs = computed<LevelUpTab[]>(() => {
    const options = this.levelUpOptions();
    if (!options) return [];
    return computeVisibleTabs(options, {
      hasMartialStances: this.showMartialStanceStep(),
      needsCompanionStep: this.needsCompanionStep(),
      trainingCompanions: this.eligibleCompanionTrainings().map(t => ({ companionId: t.companionId, name: t.name })),
    });
  });

  /** What `level-up.html`'s `@switch` actually dispatches on -- see `models/level-up.model.ts`. */
  readonly activeTabKind = computed<LevelUpTabKind | undefined>(() =>
    this.visibleTabs().find(t => t.id === this.activeTab())?.kind
  );

  readonly activeTabCompanionId = computed<number | undefined>(() =>
    this.visibleTabs().find(t => t.id === this.activeTab())?.companionId
  );

  readonly activeTrainingEntry = computed<CompanionTrainingEligibility | undefined>(() =>
    this.eligibleCompanionTrainings().find(t => t.companionId === this.activeTabCompanionId())
  );

  private static readonly TIER_3_ONLY_TYPES = new Set<string>(['UPGRADE_SUBCLASS', 'MULTICLASS']);

  readonly filteredAdvancements = computed<AvailableAdvancement[]>(() => {
    const options = this.levelUpOptions();
    if (!options) return [];
    if (options.nextLevel >= 5) return options.availableAdvancements;
    return options.availableAdvancements.filter(a => !LevelUp.TIER_3_ONLY_TYPES.has(a.type));
  });

  readonly bonusDomainCardSlots = computed<number>(() =>
    countBonusSlotsFromAdvancements(
      this.selectedAdvancements(),
      new Set(this.rawSheet()?.subclassCardIds ?? []),
      (id) => this.subclassService.getCachedCardResponseById(id),
    )
  );

  readonly baseDomainCardSelections = computed<number>(() =>
    this.selectedAdvancements().some(a => a.type === 'GAIN_DOMAIN_CARD') ? 2 : 1
  );

  readonly domainCardMaxSelections = computed<number>(() =>
    this.baseDomainCardSelections() + this.bonusDomainCardSlots()
  );

  /**
   * True when a chosen advancement THIS level-up newly grants a subclass card carrying the
   * "Stance Fighter" feature -- e.g. multiclassing into Martial Artist. Distinct from already
   * having the feature: the acquisition grant ("choose two martial stances from Tier 1") only
   * fires the level-up the feature is newly taken, never again afterward.
   */
  readonly acquiresMartialStancesThisLevelUp = computed<boolean>(() =>
    acquiresMartialStances(
      this.selectedAdvancements(),
      new Set(this.rawSheet()?.subclassCardIds ?? []),
      (id) => this.subclassService.getCachedCardResponseById(id),
      hasMartialStances(this.rawSheet()?.subclassCards),
    )
  );

  /**
   * True for characters with the Martial Artist's "Stance Fighter" feature -- the rules grant an
   * additional known stance on every level-up (not just tier transitions), so this gates the
   * `martial-stance` step independently of `computeVisibleTabs`'s tier-achievement logic. Also
   * true on the level-up that newly ACQUIRES the feature (see `acquiresMartialStances` above),
   * since a multiclassed character's existing `subclassCards` won't include the subclass being
   * chosen during this same level-up.
   */
  readonly showMartialStanceStep = computed(() =>
    hasMartialStances(this.rawSheet()?.subclassCards) || this.acquiresMartialStancesThisLevelUp()
  );

  readonly knownMartialStanceIds = computed(() => this.rawSheet()?.knownMartialStanceIds ?? []);

  /**
   * Number of stances this step must collect: 2 on the acquiring level-up (the foundation card's
   * full "choose two martial stances from Tier 1" grant, same as at character creation), 1 on
   * every other level-up ("choose an additional stance"). The acquisition grant and the ongoing
   * per-level grant never stack on the same level-up.
   */
  readonly requiredMartialStanceCount = computed<number>(() => this.acquiresMartialStancesThisLevelUp() ? 2 : 1);

  /**
   * Highest selectable stance tier. Pinned to Tier 1 on the acquiring level-up, per "choose two
   * martial stances from Tier 1" -- otherwise stances of the character's tier or lower are
   * selectable, per "choose an additional stance from your tier or lower", with tier derived from
   * the level being leveled up TO.
   */
  readonly martialStanceMaxTier = computed(() =>
    this.acquiresMartialStancesThisLevelUp() ? 1 : tierForLevel(this.levelUpOptions()?.nextLevel ?? 1)
  );

  /** True when a chosen advancement THIS level-up newly grants the Beastbound Ranger's Companion
   * foundation feature -- the `acquiresMartialStancesThisLevelUp` analog, gated on
   * `hasCompanionFeature` instead of `hasMartialStances`. */
  readonly acquiresCompanionFeatureThisLevelUp = computed<boolean>(() =>
    acquiresCompanionFeature(
      this.selectedAdvancements(),
      new Set(this.rawSheet()?.subclassCardIds ?? []),
      (id) => this.subclassService.getCachedCardResponseById(id),
      hasCompanionFeature(this.rawSheet()?.subclassCards),
    )
  );

  /**
   * Gates the `companion` tab: shown only the level-up that newly grants the feature (not every
   * level-up thereafter -- a character who already has the feature and no companion can still add
   * one from the character sheet's own "+ Add Companion", out of scope here), AND only while the
   * character has no active companion yet (companions plan §3.4/§6.6).
   */
  readonly needsCompanionStep = computed<boolean>(() =>
    this.acquiresCompanionFeatureThisLevelUp() && this.activeCompanions().length === 0
  );

  /** Extra Training picks granted THIS level-up by Expert/Advanced Training -- see
   * `companionTrainingBonusPicks` for why this must be recomputed client-side. */
  readonly companionTrainingBonusPicksThisLevelUp = computed<number>(() =>
    companionTrainingBonusPicks(
      this.selectedAdvancements(),
      new Set(this.rawSheet()?.subclassCardIds ?? []),
      (id) => this.subclassService.getCachedCardResponseById(id),
    )
  );

  readonly eligibleCompanionTrainings = computed<CompanionTrainingEligibility[]>(() =>
    this.levelUpOptions()?.companionTraining ?? []
  );

  readonly restorableCompanions = computed<CompanionApiResponse[]>(() =>
    this.levelUpOptions()?.restorableCompanions ?? []
  );

  /** Every eligible companion also gains a new Experience on a tier transition -- companions plan
   * §3.2. Empty on a non-tier-transition level-up, same gate as the character's own grant. */
  readonly companionExperienceTargets = computed<CompanionExperienceTarget[]>(() =>
    this.isTierTransition() ? this.eligibleCompanionTrainings().map(t => ({ companionId: t.companionId, name: t.name })) : []
  );

  readonly alsoHappeningItems = computed<string[]>(() => {
    const items: string[] = [];
    if (this.isTierTransition()) {
      items.push('+1 Proficiency');
      items.push('+1 Major & Severe damage thresholds');
    }
    for (const training of this.eligibleCompanionTrainings()) {
      const picks = this.picksAvailableFor(training.companionId);
      items.push(`Companion Training: ${picks} option${picks === 1 ? '' : 's'} for ${training.name}`);
    }
    for (const target of this.companionExperienceTargets()) {
      items.push(`${target.name} gains an Experience (+2)`);
    }
    if (this.eligibleCompanionTrainings().length > 0) {
      items.push('Companion Training does not use either advancement slot.');
    }
    return items;
  });

  readonly companionReviewEntries = computed<CompanionReviewEntry[]>(() => {
    const entries: CompanionReviewEntry[] = [];
    const selection = this.companionSelection();
    if (selection) {
      entries.push({
        companionId: selection.mode === 'restore' ? selection.companionId : -1,
        name: selection.mode === 'create' ? selection.draft.payload.name : selection.name,
        statusLabel: selection.mode === 'create' ? 'Creating new' : 'Restoring',
        trainingLabels: [],
      });
    }
    for (const training of this.eligibleCompanionTrainings()) {
      const experience = this.companionExperienceGrants().find(g => g.companionId === training.companionId);
      entries.push({
        companionId: training.companionId,
        name: training.name,
        trainingLabels: this.trainingSelectionsFor(training.companionId).map(s => this.formatTrainingLabel(s)),
        experienceDescription: experience?.description.trim() ? experience.description : undefined,
      });
    }
    return entries;
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
    if (tabId === 'martial-stance') {
      this.loadMartialStanceCards();
    }
  }

  onMartialStanceSelected(stanceIds: number[]): void {
    this.selectedMartialStanceIds.set(stanceIds);
    if (stanceIds.length === this.requiredMartialStanceCount()) {
      this.markStepComplete('martial-stance');
    } else {
      this.removeStepComplete('martial-stance');
    }
  }

  onExperienceDescriptionChanged(description: string): void {
    this.newExperienceDescription.set(description);
    this.refreshTierAchievementsCompletion();
  }

  onCompanionExperiencesChanged(grants: CompanionExperienceGrant[]): void {
    this.companionExperienceGrants.set(grants);
    this.refreshTierAchievementsCompletion();
  }

  private refreshTierAchievementsCompletion(): void {
    const ownComplete = this.newExperienceDescription().trim().length > 0;
    const companionsComplete = this.companionExperienceTargets().every(target =>
      (this.companionExperienceGrants().find(g => g.companionId === target.companionId)?.description ?? '').trim().length > 0
    );
    if (ownComplete && companionsComplete) {
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
    // Changing advancements can change whether the martial-stance/companion steps are shown at
    // all, how many stances martial-stance requires, and how many picks each training tab has
    // (Expert/Advanced Training's reactive bonus). Selections made under the old rules would
    // otherwise survive as a stale "complete" flag, letting the user submit an under-filled or
    // now-invalid selection.
    this.clearMartialStanceSelections();
    this.clearCompanionSelections();
  }

  /** Drops any stance picks and the step's completed flag, so the step must be re-satisfied. */
  private clearMartialStanceSelections(): void {
    this.selectedMartialStanceIds.set([]);
    this.removeStepComplete('martial-stance');
  }

  /** Drops the companion tab's create/restore choice and every training tab's staged picks, so
   * each must be re-satisfied under the (possibly changed) eligibility/picks-available rules. */
  private clearCompanionSelections(): void {
    this.companionSelection.set(null);
    this.removeStepComplete('companion');
    this.companionTrainingSelections.set({});
    for (const training of this.eligibleCompanionTrainings()) {
      this.removeStepComplete(`training-${training.companionId}`);
    }
  }

  onCompanionSelectionChanged(selection: CompanionStepSelection | null): void {
    this.companionSelection.set(selection);
    if (selection) {
      this.markStepComplete('companion');
    } else {
      this.removeStepComplete('companion');
    }
  }

  trainingSelectionsFor(companionId: number): CompanionTrainingSelection[] {
    return this.companionTrainingSelections()[companionId] ?? [];
  }

  picksAvailableFor(companionId: number): number {
    const entry = this.eligibleCompanionTrainings().find(t => t.companionId === companionId);
    return (entry?.picksAvailable ?? 0) + this.companionTrainingBonusPicksThisLevelUp();
  }

  onTrainingSelectionsChanged(companionId: number, selections: CompanionTrainingSelection[]): void {
    this.companionTrainingSelections.update(current => ({ ...current, [companionId]: selections }));
    const tabId = `training-${companionId}`;
    if (selections.length === this.picksAvailableFor(companionId)) {
      this.markStepComplete(tabId);
    } else {
      this.removeStepComplete(tabId);
    }
  }

  private formatTrainingLabel(selection: CompanionTrainingSelection): string {
    const label = COMPANION_TRAINING_LABELS[selection.option];
    if (selection.viciousAxis) {
      return `${label} (${selection.viciousAxis === 'DAMAGE_DIE' ? 'Damage Die' : 'Range'})`;
    }
    return label;
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

  onTradeDisplayChanged(pairs: TradeDisplayPair[]): void {
    this.tradeDisplayPairs.set(pairs);
  }

  onTradeRowChanged(row: TradeRow | null): void {
    this.tradeRow.set(row);
  }

  onTradesSkippedChanged(skipped: boolean): void {
    this.tradesSkipped.set(skipped);
  }

  onSubmit(): void {
    const options = this.levelUpOptions();
    const cards = this.selectedDomainCards();
    if (!options || cards.length === 0) return;

    const base = this.baseDomainCardSelections();

    const advancements = this.selectedAdvancements().map(a => {
      if (a.type === 'GAIN_DOMAIN_CARD' && cards.length > 1) {
        return { ...a, domainCardId: cards[1].id, equipDomainCard: this.equipNewDomainCard() };
      }
      return a;
    });

    const bonusDomainCardIds = cards.slice(base).map(c => c.id);

    this.submitting.set(true);
    this.submitError.set(null);

    // Phase 0: resolve `newCompanionId` before the level-up call itself, since a brand-new
    // companion's id must be sent INSIDE that request. Guarded independently of `levelUpCompleted`
    // (see `companionCreatedId`) so a retry after a later phase's failure never creates a second
    // companion.
    this.resolveCompanionId().pipe(
      switchMap(newCompanionId => {
        const request = assembleLevelUpRequest({
          advancements,
          newExperienceDescription: this.isTierTransition() ? this.newExperienceDescription() : undefined,
          newDomainCardId: cards[0].id,
          equipNewDomainCard: this.equipNewDomainCard(),
          unequipDomainCardId: this.unequipDomainCardId(),
          trades: this.trades(),
          bonusDomainCardIds,
          companionTrainings: Object.values(this.companionTrainingSelections()).flat(),
          companionExperiences: this.isTierTransition()
            ? this.companionExperienceGrants().filter(g => g.description.trim().length > 0)
            : [],
          newCompanionId,
        });

        // The level-up and the stance attach are two calls. If the level-up lands but the stance
        // PUT fails, the character is ALREADY leveled -- resubmitting `levelUp` would level them a
        // second time. So record that the first phase succeeded and, on retry, resume from the
        // stance PUT.
        const firstPhase$: Observable<unknown> = this.levelUpCompleted()
          ? of(null)
          : this.characterSheetService
              .levelUp(this.characterId, request)
              .pipe(tap(() => this.levelUpCompleted.set(true)));

        return firstPhase$.pipe(switchMap(() => this.attachMartialStance()));
      }),
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/character', this.characterId]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const message = err && typeof err === 'object' && 'error' in err
          ? (err.error as { message?: string } | undefined)?.message
          : undefined;

        const selection = this.companionSelection();
        if (selection?.mode === 'create' && this.companionCreatedId() == null) {
          this.submitError.set(message ?? 'Failed to create your companion. Submit again to retry.');
          return;
        }

        this.submitError.set(
          this.levelUpCompleted()
            ? (message ?? 'Your character leveled up, but the new stance could not be saved. Submit again to retry saving the stance.')
            : (message ?? 'Failed to level up. Please try again.'),
        );
      },
    });
  }

  /**
   * Resolves the id to send as `LevelUpRequest.newCompanionId`. Restoring is a no-op here (the
   * backend restores the soft-deleted companion as part of applying the level-up request itself);
   * creating POSTs the new companion (and its initial Experiences, best-effort, mirroring
   * `character-sheet.ts`'s `createCompanionExperiences`) exactly once, skipping the call entirely
   * on retry once `companionCreatedId` is set.
   */
  private resolveCompanionId(): Observable<number | undefined> {
    const selection = this.companionSelection();
    if (!selection) return of(undefined);
    if (selection.mode === 'restore') return of(selection.companionId);

    const createdId = this.companionCreatedId();
    if (createdId != null) return of(createdId);

    return this.companionService.createCompanion(selection.draft.payload).pipe(
      switchMap(created => {
        this.companionCreatedId.set(created.id);
        const completeExperiences = selection.draft.experiences.filter(isExperienceComplete);
        if (completeExperiences.length === 0) return of(created.id);
        return forkJoin(
          completeExperiences.map(exp =>
            this.characterSheetService.createExperience({
              companionId: created.id,
              description: exp.name,
              modifier: exp.modifier!,
            }),
          ),
        ).pipe(map(() => created.id));
      }),
    );
  }

  /**
   * Adds the newly chosen stance(s) to the character's known stances. `knownMartialStanceIds` is
   * a full-collection replacement on the backend, so this sends the existing ids plus ALL newly
   * selected ones -- sending only the new id(s) would silently wipe every previously known
   * stance.
   */
  private attachMartialStance() {
    const newStanceIds = this.selectedMartialStanceIds();
    // Defense in depth: the step's own cap and the completed-step gate should both already
    // guarantee this, but the required count is derived from the chosen advancements and can move
    // after the step was satisfied. Re-check against the CURRENT requirement rather than trusting
    // a flag set earlier, so an under-filled selection can never be persisted.
    if (!this.showMartialStanceStep() || newStanceIds.length !== this.requiredMartialStanceCount()) {
      return of(null);
    }
    const next = [...this.knownMartialStanceIds(), ...newStanceIds];
    return this.characterSheetService.updateCharacterSheet(this.characterId, { knownMartialStanceIds: next });
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
      companions: this.companionService.getCompanions(id),
    }).subscribe({
      next: ({ sheet, options, companions }) => {
        const user = this.authService.user();
        if (user && sheet.ownerId !== user.id) {
          this.error.set('You do not own this character.');
          this.loading.set(false);
          return;
        }

        this.rawSheet.set(sheet);
        this.characterSheet.set(mapToCharacterSheetView(sheet));
        this.levelUpOptions.set(options);
        this.activeCompanions.set(companions);

        this.activeTab.set(this.visibleTabs()[0].id);

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load level-up data.');
        this.loading.set(false);
      },
    });
  }

  private loadMartialStanceCards(): void {
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
