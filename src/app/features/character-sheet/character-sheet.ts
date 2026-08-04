import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal, computed } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, EMPTY, switchMap, debounceTime, tap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { DiceRollerService } from '../../core/services/dice-roller.service';
import { SavingSpinner } from '../../shared/components/saving-spinner/saving-spinner';
import { ResourceTracker } from '../../shared/components/resource-tracker/resource-tracker';
import { isAtLeast } from '../../shared/models/role.model';
import { FormatTextPipe } from '../../shared/pipes/format-text.pipe';
import { mapToCharacterSheetView } from './utils/character-sheet-view.mapper';
import { hasBeastformFeature } from './utils/beastform-access.utils';
import { hasMartialStances } from './utils/martial-stance-access.utils';
import { hasWarlockResources, hasBrawlerResources } from './utils/hf-class-resource-access.utils';
import { patronDieForLevel } from './utils/patron-die.utils';
import { hasCompanionFeature, showCompanionPanel, canCreateCompanion, companionClassFeatureReminders } from './utils/companion-access.utils';
import { BeastformSection } from './components/beastform-section/beastform-section';
import { MartialStancePanel } from './components/martial-stance-panel/martial-stance-panel';
import { TransformationPanel } from './components/transformation-panel/transformation-panel';
import { CompanionPanel, CompanionStressChangedEvent, CompanionTrainingAddedEvent, CompanionTrainingRemovedEvent } from './components/companion-panel/companion-panel';
import { CompanionCreateSubmission, CompanionUpdateSubmission } from './components/companion-panel/components/companion-form-modal/companion-form-modal';
import { CompanionService } from '../../shared/services/companion.service';
import { CompanionApiResponse } from '../../shared/models/companion-api.model';
import { Experience, isExperienceComplete } from '../../shared/models/experience.model';
import { CharacterSheetView, TRAIT_SUBSKILLS, WeaponDisplay } from './models/character-sheet-view.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { InventorySection } from './components/inventory-section/inventory-section';
import { ModifierIndicator } from './components/modifier-indicator/modifier-indicator';
import { DiceRoller } from '../../shared/components/dice-roller/dice-roller';
import { WeaponResponse } from '../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../shared/models/armor-api.model';
import { LootApiResponse } from '../../shared/models/loot-api.model';
import { TransformationCardService } from '../../shared/services/transformation-card.service';
import { TransformationCardResponse } from '../../shared/models/transformation-card-api.model';
import {
  WeaponResponse as CsWeaponResponse,
  ArmorResponse as CsArmorResponse,
  InventoryWeaponResponse,
  InventoryArmorResponse,
  InventoryLootResponse,
  UpdateCharacterSheetRequest,
} from '../create-character/models/character-sheet-api.model';
import {
  InventoryRemoveEvent,
  InventoryEquipWeaponEvent,
  InventoryEquipArmorEvent,
} from './components/inventory-section/inventory-section';

@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrls: ['./character-sheet.css', './character-sheet-layout.css', './character-sheet-panels.css', './character-sheet-equipment.css', './character-sheet-notes.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SavingSpinner, RouterLink, FormatTextPipe, InventorySection, ModifierIndicator, DiceRoller, DecimalPipe, LowerCasePipe, BeastformSection, MartialStancePanel, TransformationPanel, ResourceTracker, CompanionPanel],
})
export class CharacterSheet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly authService = inject(AuthService);
  private readonly diceRollerService = inject(DiceRollerService);
  private readonly transformationCardService = inject(TransformationCardService);
  private readonly companionService = inject(CompanionService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly characterSheet = signal<CharacterSheetView | null>(null);
  readonly inventoryError = signal<string | null>(null);
  private readonly rawSheet = signal<CharacterSheetResponse | null>(null);
  private readonly expandedCardIds = signal<Set<number>>(new Set());
  private nextTempInventoryId = -1;

  private readonly localHpMarked = signal<number | null>(null);
  private readonly localStressMarked = signal<number | null>(null);
  private readonly localHopeMarked = signal<number | null>(null);
  private readonly localArmorMarked = signal<number | null>(null);
  private readonly localGoldAdjustment = signal(0);
  private readonly swapInFlight = signal(false);
  /** True while a Hope & Fear stance/transformation PUT is in flight; disables the panel controls. */
  readonly hfActionInFlight = signal(false);

  private readonly localFocusMarked = signal<number | null>(null);
  private readonly localFavor = signal<number | null>(null);
  readonly lastFocusRoll = signal<number | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  private readonly healthSave$ = new Subject<void>();
  private readonly hopeStressSave$ = new Subject<void>();
  private readonly goldSave$ = new Subject<void>();
  private readonly notesSave$ = new Subject<void>();
  private readonly focusSave$ = new Subject<void>();
  private readonly favorSave$ = new Subject<void>();

  private readonly savingSections = signal<Set<string>>(new Set());
  readonly isSavingHealth = computed(() => this.savingSections().has('health'));
  readonly isSavingHopeStress = computed(() => this.savingSections().has('hopeStress'));
  readonly isSavingGold = computed(() => this.savingSections().has('gold'));
  readonly isSavingFocus = computed(() => this.savingSections().has('focus'));
  readonly isSavingFavor = computed(() => this.savingSections().has('favor'));

  readonly markedHp = computed(() => this.localHpMarked() ?? (this.characterSheet()?.hitPointMarked ?? 0));
  readonly markedStress = computed(() => this.localStressMarked() ?? (this.characterSheet()?.stressMarked ?? 0));
  /** Clamped against `hopeMax + companionGrantedHopeSlots`, not just `hopeMax` -- if a companion
   * carrying `LIGHT_IN_THE_DARK` is deleted (or that Training is removed) while a bonus slot was
   * marked, the derived total shrinks and a stale `hopeMarked` must not exceed it. Do not route
   * this through the `HOPE_MAX` modifier system -- see companions plan §6.4. */
  readonly markedHope = computed(() => {
    const raw = this.localHopeMarked() ?? (this.characterSheet()?.hopeMarked ?? 0);
    const total = (this.characterSheet()?.hopeMax.modified ?? 0) + this.companionGrantedHopeSlots();
    return Math.min(raw, total);
  });
  readonly markedArmor = computed(() => this.localArmorMarked() ?? (this.characterSheet()?.armorMarked ?? 0));
  readonly currentGold = computed(() => (this.characterSheet()?.gold ?? 0) + this.localGoldAdjustment());

  readonly focusMax = computed(() => this.rawSheet()?.focusMax ?? 0);
  readonly markedFocus = computed(() => this.localFocusMarked() ?? (this.rawSheet()?.focusMarked ?? 0));
  readonly currentFavor = computed(() => this.localFavor() ?? (this.rawSheet()?.favor ?? 0));

  /**
   * Martial Stances are granted by the Martial Artist subclass foundation feature "Stance
   * Fighter", so -- unlike Beastform -- the gate scans `subclassCards`, not `classes`.
   */
  readonly showMartialStances = computed(() => hasMartialStances(this.rawSheet()?.subclassCards));

  /** Warlock's Favor + Patron Die, gated on the "Patron's Pact" class feature. */
  readonly showWarlockResources = computed(() => hasWarlockResources(this.rawSheet()?.classes));

  /** Brawler's stored Combo Die, gated on the "Combo Strike" class feature. */
  readonly showBrawlerResources = computed(() => hasBrawlerResources(this.rawSheet()?.classes));

  /** Combo Die is a player choice (once per tier) and is stored; it defaults to a d4 per the
   * printed rule until the player upgrades it via level-up. */
  readonly comboDie = computed(() => this.rawSheet()?.comboDie ?? 'D4');

  /** Patron Die has no player input, so it is derived from level rather than persisted. */
  readonly patronDie = computed(() => patronDieForLevel(this.rawSheet()?.level ?? 1));

  readonly knownMartialStances = computed(() => this.rawSheet()?.knownMartialStances ?? []);
  readonly activeMartialStanceId = computed(() => this.rawSheet()?.activeMartialStanceId ?? null);

  /**
   * The character-sheet endpoint's `?expand=transformationCard` always resolves the nested card
   * with an empty expand set server-side, so it never carries `features`/`questions` -- only the
   * 6 official cards exist, so the full catalog (already `?expand=features,questions`) is fetched
   * once and matched by id to fill those in, falling back to the sheet's bare card while that
   * fetch is pending or if it fails. The same catalog also backs the acquisition picker, since
   * "add" and "change" both need the full 6-card list regardless of what's currently attached.
   */
  readonly transformationCatalog = signal<TransformationCardResponse[]>([]);
  readonly transformationCatalogLoading = signal(false);
  readonly transformationCatalogError = signal(false);
  readonly transformationCard = computed(() => {
    const id = this.rawSheet()?.transformationCardId;
    if (id == null) return null;
    return this.transformationCatalog().find(c => c.id === id) ?? this.rawSheet()?.transformationCard ?? null;
  });
  /** Transformations are GM-granted: the panel stays hidden for everyone until the flag is set. */
  readonly transformationEnabled = computed(() => this.rawSheet()?.transformationEnabled ?? false);
  readonly transformationTokens = computed(() => this.rawSheet()?.transformationTokens ?? null);
  readonly wolfFormActive = computed(() => this.rawSheet()?.wolfFormActive ?? false);

  readonly isOwner = computed(() => {
    const sheet = this.characterSheet();
    const user = this.authService.user();
    return sheet !== null && user !== null && sheet.ownerId === user.id;
  });

  readonly canAccessNotes = computed(() => {
    const sheet = this.characterSheet();
    const user = this.authService.user();
    if (!sheet || !user) return false;
    return sheet.ownerId === user.id || isAtLeast(user.role, 'MODERATOR');
  });

  /**
   * Companions: fetched separately via `CompanionService.getCompanions(characterSheetId)` rather
   * than an `?expand=companions` key on the sheet response -- core WP3 (which adds that expand,
   * plus `companionsEnabled`/`companionGrantedHopeSlots`) may not have landed yet when this runs,
   * and the dedicated companions endpoint is already live either way.
   */
  readonly companions = signal<CompanionApiResponse[]>([]);
  readonly companionsLoading = signal(false);
  /** Single in-flight flag, not per-companion -- mirrors `hfActionInFlight`'s shape rather than
   * tracking a saving `Set<number>`, since concurrent companion edits are rare. */
  readonly companionActionInFlight = signal(false);
  readonly companionError = signal<string | null>(null);

  /** Beastbound Ranger's "Companion" foundation feature -- see `hasCompanionFeature`'s doc for
   * why this is stricter than a name-only match. */
  readonly companionFeatureGranted = computed(() => hasCompanionFeature(this.rawSheet()?.subclassCards));
  readonly companionsEnabled = computed(() => this.rawSheet()?.companionsEnabled ?? false);
  /** A GM turning `companionsEnabled` off never hides an existing companion -- see companions
   * plan §3.4. */
  readonly showCompanionsSection = computed(() =>
    showCompanionPanel(this.companionFeatureGranted(), this.companionsEnabled(), this.companions().length));
  readonly canAddCompanion = computed(() => canCreateCompanion(this.companionFeatureGranted(), this.companionsEnabled()));
  readonly canManageCompanions = computed(() => this.isOwner() || this.authService.isAdmin());
  readonly companionGrantedHopeSlots = computed(() => this.rawSheet()?.companionGrantedHopeSlots ?? 0);
  /** "Battle-Bonded"/"Loyal Friend" verbatim reminders -- see `companionClassFeatureReminders`'s
   * doc. Computed once here (not per-companion) from the character's own subclass cards. Named
   * `companionFeatureReminders`, not the same as the imported util, so the arrow function below
   * unambiguously calls the util rather than shadowing itself. */
  readonly companionFeatureReminders = computed(() => companionClassFeatureReminders(this.rawSheet()?.subclassCards));
  readonly companionArmorAvailable = computed(() => this.markedArmor() < (this.characterSheet()?.armorScore.modified ?? 0));

  private readonly localNotes = signal<string | null>(null);
  readonly notesExpanded = signal(false);
  readonly notesSavedAt = signal<number | null>(null);

  readonly currentNotes = computed(() => {
    const local = this.localNotes();
    if (local !== null) return local;
    const sheet = this.characterSheet();
    return sheet?.notes ?? '';
  });
  readonly notesCharCount = computed(() => this.currentNotes().length);
  readonly isSavingNotes = computed(() => this.savingSections().has('notes'));

  readonly canLevelUp = computed(() => {
    const sheet = this.characterSheet();
    return this.isOwner() && sheet !== null && sheet.level < 10;
  });

  readonly canLevelDown = computed(() => {
    const sheet = this.characterSheet();
    return this.isOwner() && sheet !== null && sheet.level >= 10;
  });

  /**
   * Beastform is a class feature, not a per-character unlock, so the reference section shows
   * whenever ANY of the character's classes grants it. Scanning `classes` rather than the
   * deprecated singular `class` is what makes this multiclass-safe, and keying off the feature
   * name rather than "Druid" is what makes it work for homebrew/expansion classes.
   */
  readonly showBeastforms = computed(() => hasBeastformFeature(this.rawSheet()?.classes));

  private readonly weaponEquipConstraints = computed(() => {
    const raw = this.rawSheet();
    const weapons = raw?.inventoryWeapons ?? [];
    const primarySlotOccupied = weapons.some(w => w.slot === 'PRIMARY');
    const secondarySlotOccupied = weapons.some(w => w.slot === 'SECONDARY');
    const twoHandedEquipped = weapons.some(
      w => (w.slot === 'PRIMARY' || w.slot === 'SECONDARY') && w.weapon?.burden === 'TWO_HANDED'
    );
    return { primarySlotOccupied, secondarySlotOccupied, twoHandedEquipped };
  });

  readonly weaponConstraints = computed(() => this.weaponEquipConstraints());

  readonly canEquipPrimaryWeapon = computed(() => {
    const c = this.weaponEquipConstraints();
    return !c.primarySlotOccupied && !c.twoHandedEquipped;
  });

  readonly canEquipSecondaryWeapon = computed(() => {
    const c = this.weaponEquipConstraints();
    return !c.secondarySlotOccupied && !c.twoHandedEquipped;
  });

  canEquipWeaponInSlot(weapon: WeaponDisplay, slot: 'primary' | 'secondary'): boolean {
    const c = this.weaponEquipConstraints();
    if (weapon.burden === 'TWO_HANDED') {
      return slot === 'primary' && !c.primarySlotOccupied && !c.secondarySlotOccupied && !c.twoHandedEquipped;
    }
    if (c.twoHandedEquipped) return false;
    if (slot === 'primary') return !c.primarySlotOccupied;
    return !c.secondarySlotOccupied;
  }

  readonly canEquipArmor = computed(() => {
    const raw = this.rawSheet();
    if (!raw) return false;
    return !(raw.inventoryArmors ?? []).some(a => a.equipped);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.loadCharacterSheet(id);
    this.initSavePipelines();
  }

  private loadCharacterSheet(id: number): void {
    const expandFields = [
      'experiences',
      'communityCards',
      'ancestryCards',
      'class',
      'subclassCards',
      'domainCards',
      'inventoryWeapons',
      'inventoryArmors',
      'inventoryItems',
      'features',
      'questions',
      'costTags',
      'modifiers',
      'transformationCard',
      'knownMartialStances',
      'activeMartialStance',
    ];

    this.characterSheetService
      .getCharacterSheet(id, expandFields)
      .subscribe({
        next: (response) => {
          this.rawSheet.set(response);
          this.characterSheet.set(mapToCharacterSheetView(response));
          this.loading.set(false);
          this.loadTransformationCatalog();
          this.loadCompanions(id);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  private loadCompanions(characterSheetId: number): void {
    this.companionsLoading.set(true);
    this.companionService.getCompanions(characterSheetId).subscribe({
      next: list => {
        this.companions.set(list);
        this.companionsLoading.set(false);
      },
      error: () => {
        this.companionsLoading.set(false);
      },
    });
  }

  /** Applies a `ResourceTracker`'s already-resolved `markedChange` value and queues the save. */
  setResourceMarked(resource: 'hp' | 'stress' | 'hope' | 'armor' | 'focus', newValue: number): void {
    switch (resource) {
      case 'hp': this.localHpMarked.set(newValue); break;
      case 'stress': this.localStressMarked.set(newValue); break;
      case 'hope': this.localHopeMarked.set(newValue); break;
      case 'armor': this.localArmorMarked.set(newValue); break;
      case 'focus': this.localFocusMarked.set(newValue); break;
    }
    if (resource === 'hp' || resource === 'armor') {
      this.healthSave$.next();
    } else if (resource === 'focus') {
      this.focusSave$.next();
    } else {
      this.hopeStressSave$.next();
    }
  }

  /**
   * Loaded unconditionally (not only when a card is already attached) because the empty-state
   * "Choose a transformation" picker needs the full catalog too -- a character with nothing attached
   * still has an entry point that requires the same 6-card list.
   */
  private loadTransformationCatalog(): void {
    this.transformationCatalogLoading.set(true);
    this.transformationCardService.getAllTransformationCards().subscribe({
      next: cards => {
        this.transformationCatalog.set(cards);
        this.transformationCatalogLoading.set(false);
      },
      error: () => {
        this.transformationCatalogError.set(true);
        this.transformationCatalogLoading.set(false);
      },
    });
  }

  /**
   * Rolls Instinct-many d6 through the shared client-side dice roller and gains Focus equal to
   * the HIGHEST single die -- not a sum, and not simply refilling to max. There is deliberately no
   * backend endpoint for this: every roll in the app is client-side, with the server only storing
   * the result.
   */
  refreshFocus(): void {
    if (!this.isOwner()) return;
    const instinct = this.rawSheet()?.instinctModifier ?? 0;
    const diceCount = Math.max(instinct, 1);
    const result = this.diceRollerService.roll({ dice: [{ type: 'd6', count: diceCount }], includeDuality: false });
    const highest = Math.max(...result.diceResults.map(d => d.value));
    const clamped = Math.min(highest, this.focusMax());
    this.lastFocusRoll.set(highest);
    this.localFocusMarked.set(clamped);
    this.focusSave$.next();
  }

  adjustFavor(amount: number): void {
    this.localFavor.update(current => (current ?? this.rawSheet()?.favor ?? 0) + amount);
    this.favorSave$.next();
  }

  onActivateMartialStance(stanceId: number): void {
    const raw = this.rawSheet();
    if (!raw || !this.isOwner() || this.hfActionInFlight()) return;
    if (raw.activeMartialStanceId === stanceId) return;

    const focusBefore = this.markedFocus();
    if (focusBefore < 1) return;
    const newFocus = focusBefore - 1;
    const activeStance = this.knownMartialStances().find(s => s.id === stanceId) ?? null;

    const previousRaw = raw;
    this.rawSheet.set({ ...raw, activeMartialStanceId: stanceId, activeMartialStance: activeStance ?? undefined, focusMarked: newFocus });
    // Clear the pip-toggle override so `markedFocus()` reads the post-activation value from
    // rawSheet. Without this, a Focus pip toggled within the last 800ms leaves a stale local
    // override that both hides the spent Focus and gets PUT by the debounced focusSave$ pipeline
    // when it fires, silently refunding the Focus this stance shift just cost.
    this.localFocusMarked.set(null);
    this.hfActionInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { activeMartialStanceId: stanceId, focusMarked: newFocus })
      .subscribe({
        next: () => this.hfActionInFlight.set(false),
        error: () => {
          this.rawSheet.set(previousRaw);
          this.hfActionInFlight.set(false);
        },
      });
  }

  onClearMartialStance(): void {
    const raw = this.rawSheet();
    if (!raw || !this.isOwner() || this.hfActionInFlight()) return;

    const previousRaw = raw;
    this.rawSheet.set({ ...raw, activeMartialStanceId: undefined, activeMartialStance: undefined });
    this.hfActionInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { clearActiveMartialStance: true })
      .subscribe({
        next: () => this.hfActionInFlight.set(false),
        error: () => {
          this.rawSheet.set(previousRaw);
          this.hfActionInFlight.set(false);
        },
      });
  }

  onTransformationTokensChange(newTokens: number): void {
    const raw = this.rawSheet();
    if (!raw || !this.isOwner() || this.hfActionInFlight()) return;

    const previousRaw = raw;
    this.rawSheet.set({ ...raw, transformationTokens: newTokens });
    this.hfActionInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { transformationTokens: newTokens })
      .subscribe({
        next: () => this.hfActionInFlight.set(false),
        error: () => {
          this.rawSheet.set(previousRaw);
          this.hfActionInFlight.set(false);
        },
      });
  }

  onWolfFormToggle(active: boolean): void {
    const raw = this.rawSheet();
    if (!raw || !this.isOwner() || this.hfActionInFlight()) return;

    const previousRaw = raw;
    this.rawSheet.set({ ...raw, wolfFormActive: active });
    this.hfActionInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { wolfFormActive: active })
      .subscribe({
        next: () => this.hfActionInFlight.set(false),
        error: () => {
          this.rawSheet.set(previousRaw);
          this.hfActionInFlight.set(false);
        },
      });
  }

  /**
   * Handles both "Choose a transformation" and "Change" -- per "A PC can have only one
   * transformation," a selection always replaces the single FK, it never appends to a
   * collection. Guarded by `hfActionInFlight` and mirrors the optimistic-update/rollback shape of
   * `onWolfFormToggle` above.
   */
  onTransformationSelected(cardId: number): void {
    const raw = this.rawSheet();
    if (!raw || !this.isOwner() || this.hfActionInFlight()) return;
    if (raw.transformationCardId === cardId) return;

    const previousRaw = raw;
    this.rawSheet.set({ ...raw, transformationCardId: cardId, transformationCard: undefined });
    this.hfActionInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { transformationCardId: cardId })
      .subscribe({
        next: () => this.hfActionInFlight.set(false),
        error: () => {
          this.rawSheet.set(previousRaw);
          this.hfActionInFlight.set(false);
        },
      });
  }

  onTransformationRemoved(): void {
    const raw = this.rawSheet();
    if (!raw || !this.isOwner() || this.hfActionInFlight()) return;
    if (raw.transformationCardId == null) return;

    const previousRaw = raw;
    this.rawSheet.set({ ...raw, transformationCardId: undefined, transformationCard: undefined });
    this.hfActionInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { clearTransformationCard: true })
      .subscribe({
        next: () => this.hfActionInFlight.set(false),
        error: () => {
          this.rawSheet.set(previousRaw);
          this.hfActionInFlight.set(false);
        },
      });
  }

  formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  toggleCard(id: number): void {
    this.expandedCardIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isCardExpanded(id: number): boolean {
    return this.expandedCardIds().has(id);
  }

  getSubSkills(traitName: string): string[] {
    return TRAIT_SUBSKILLS[traitName] ?? [];
  }

  adjustGold(amount: number): void {
    this.localGoldAdjustment.update(current => current + amount);
    this.goldSave$.next();
  }

  onNotesInput(event: Event): void {
    if (!this.canAccessNotes()) return;
    const value = (event.target as HTMLTextAreaElement).value;
    const capped = value.length > 10000 ? value.slice(0, 10000) : value;
    this.localNotes.set(capped);
    this.notesSavedAt.set(null);
    this.notesSave$.next();
  }

  toggleNotesExpanded(): void {
    this.notesExpanded.update(open => !open);
  }

  canEquipCard(): boolean {
    const sheet = this.characterSheet();
    return sheet !== null && sheet.equippedDomainCards.length < sheet.maxEquippedDomainCards;
  }

  onVaultCard(cardId: number): void {
    this.swapDomainCard(cardId, 'to-vault');
  }

  onEquipCard(cardId: number): void {
    this.swapDomainCard(cardId, 'to-equipped');
  }

  isWeaponEquipped(weaponId: number): 'primary' | 'secondary' | null {
    const raw = this.rawSheet();
    if (!raw) return null;
    const entry = (raw.inventoryWeapons ?? []).find(w => w.weaponId === weaponId && w.equipped);
    if (!entry) return null;
    return entry.slot === 'PRIMARY' ? 'primary' : 'secondary';
  }

  isArmorEquipped(armorId: number): boolean {
    const raw = this.rawSheet();
    if (!raw) return false;
    return (raw.inventoryArmors ?? []).some(a => a.armorId === armorId && a.equipped);
  }

  onEquipWeapon(event: InventoryEquipWeaponEvent): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const targetEntry = (raw.inventoryWeapons ?? []).find(w => w.id === event.inventoryEntryId);
    if (!targetEntry || targetEntry.equipped) return;

    const { primarySlotOccupied, secondarySlotOccupied, twoHandedEquipped } = this.weaponEquipConstraints();
    const isTwoHanded = targetEntry.weapon?.burden === 'TWO_HANDED';

    let ruleError: string | null = null;
    if (isTwoHanded && (event.slot === 'secondary' || primarySlotOccupied || secondarySlotOccupied || twoHandedEquipped)) {
      ruleError = 'Two-handed weapons need both slots free. Unequip your other weapon first.';
    } else if (twoHandedEquipped) {
      ruleError = 'A two-handed weapon is already equipped. Unequip it before equipping another weapon.';
    } else if (event.slot === 'primary' && primarySlotOccupied) {
      ruleError = 'Unequip your current primary weapon before equipping a new one.';
    } else if (event.slot === 'secondary' && secondarySlotOccupied) {
      ruleError = 'Unequip your current secondary weapon before equipping a new one.';
    }

    if (ruleError) {
      this.inventoryError.set(ruleError);
      return;
    }

    const apiSlot = event.slot === 'primary' ? 'PRIMARY' as const : 'SECONDARY' as const;
    const updatedWeapons = (raw.inventoryWeapons ?? []).map(w => {
      if (w.id === event.inventoryEntryId) {
        return { ...w, equipped: true, slot: apiSlot };
      }
      return w;
    });

    const updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not equip weapon. Please try again.', raw);
          this.swapInFlight.set(false);
        },
      });
  }

  onUnequipWeapon(slot: 'primary' | 'secondary'): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const apiSlot = slot === 'primary' ? 'PRIMARY' : 'SECONDARY';
    const updatedWeapons = (raw.inventoryWeapons ?? []).map(w => {
      if (w.slot === apiSlot) {
        return { ...w, equipped: false, slot: undefined };
      }
      return w;
    });

    const updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not unequip weapon. Please try again.', raw);
          this.swapInFlight.set(false);
        },
      });
  }

  onEquipArmor(event: InventoryEquipArmorEvent): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const updatedArmors = (raw.inventoryArmors ?? []).map(a => {
      if (a.id === event.inventoryEntryId) {
        return { ...a, equipped: true };
      }
      return a;
    });

    const updatedRaw = { ...raw, inventoryArmors: updatedArmors };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not equip armor. Please try again.', raw);
          this.swapInFlight.set(false);
        },
      });
  }

  onUnequipArmor(): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const updatedArmors = (raw.inventoryArmors ?? []).map(a => ({
      ...a,
      equipped: false,
    }));

    const updatedRaw = { ...raw, inventoryArmors: updatedArmors };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not unequip armor. Please try again.', raw);
          this.swapInFlight.set(false);
        },
      });
  }

  onAddInventoryItem(event: { type: 'weapon' | 'armor' | 'loot'; item: unknown }): void {
    const raw = this.rawSheet();
    if (!raw) return;

    const tempEntryId = this.nextTempInventoryId--;
    let updatedRaw: CharacterSheetResponse;
    let payload: UpdateCharacterSheetRequest;

    if (event.type === 'weapon') {
      const weapon = event.item as WeaponResponse;
      const newEntry: InventoryWeaponResponse = {
        id: tempEntryId,
        weaponId: weapon.id,
        equipped: false,
        weapon: weapon as unknown as CsWeaponResponse,
      };
      const updatedWeapons = [...(raw.inventoryWeapons ?? []), newEntry];
      updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
      payload = { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons };
    } else if (event.type === 'armor') {
      const armor = event.item as ArmorResponse;
      const newEntry: InventoryArmorResponse = {
        id: tempEntryId,
        armorId: armor.id,
        equipped: false,
        armor: armor as unknown as CsArmorResponse,
      };
      const updatedArmors = [...(raw.inventoryArmors ?? []), newEntry];
      updatedRaw = { ...raw, inventoryArmors: updatedArmors };
      payload = { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors };
    } else {
      const loot = event.item as LootApiResponse;
      const newEntry: InventoryLootResponse = { id: tempEntryId, lootId: loot.id, loot };
      const updatedItems = [...(raw.inventoryItems ?? []), newEntry];
      updatedRaw = { ...raw, inventoryItems: updatedItems };
      payload = { inventoryItems: this.serializeInventory(updatedRaw).inventoryItems };
    }

    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));

    this.characterSheetService.updateCharacterSheet(raw.id, payload).subscribe({
      next: () => {
        this.inventoryError.set(null);
        this.loadCharacterSheet(raw.id);
      },
      error: () => {
        this.handleInventoryError(`Could not add ${event.type}. Please try again.`, raw);
      },
    });
  }

  onRemoveInventoryItem(event: InventoryRemoveEvent): void {
    const raw = this.rawSheet();
    if (!raw) return;

    let updatedRaw: CharacterSheetResponse;
    let payload: UpdateCharacterSheetRequest;

    if (event.type === 'weapon') {
      const updatedWeapons = (raw.inventoryWeapons ?? []).filter(w => w.id !== event.inventoryEntryId);
      updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
      payload = { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons };
    } else if (event.type === 'armor') {
      const updatedArmors = (raw.inventoryArmors ?? []).filter(a => a.id !== event.inventoryEntryId);
      updatedRaw = { ...raw, inventoryArmors: updatedArmors };
      payload = { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors };
    } else {
      const updatedItems = (raw.inventoryItems ?? []).filter(i => i.id !== event.inventoryEntryId);
      updatedRaw = { ...raw, inventoryItems: updatedItems };
      payload = { inventoryItems: this.serializeInventory(updatedRaw).inventoryItems };
    }

    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));

    this.characterSheetService.updateCharacterSheet(raw.id, payload).subscribe({
      next: () => {
        this.inventoryError.set(null);
        this.loadCharacterSheet(raw.id);
      },
      error: () => {
        this.handleInventoryError(`Could not remove ${event.type}. Please try again.`, raw);
      },
    });
  }

  private serializeInventory(raw: CharacterSheetResponse): Pick<UpdateCharacterSheetRequest, 'inventoryWeapons' | 'inventoryArmors' | 'inventoryItems'> {
    return {
      inventoryWeapons: (raw.inventoryWeapons ?? []).map(w => ({
        weaponId: w.weaponId,
        equipped: w.equipped,
        ...(w.slot ? { slot: w.slot } : {}),
      })),
      inventoryArmors: (raw.inventoryArmors ?? []).map(a => ({
        armorId: a.armorId,
        equipped: a.equipped,
      })),
      inventoryItems: (raw.inventoryItems ?? []).map(i => ({ lootId: i.lootId })),
    };
  }

  private handleInventoryError(message: string, previousRaw: CharacterSheetResponse): void {
    this.rawSheet.set(previousRaw);
    this.characterSheet.set(mapToCharacterSheetView(previousRaw));
    this.inventoryError.set(message);
  }

  onDismissInventoryError(): void {
    this.inventoryError.set(null);
  }

  private swapDomainCard(cardId: number, direction: 'to-vault' | 'to-equipped'): void {
    const sheet = this.characterSheet();
    if (!sheet || this.swapInFlight()) return;

    const equipped = [...sheet.equippedDomainCards];
    const vault = [...sheet.vaultDomainCards];

    if (direction === 'to-vault') {
      const idx = equipped.findIndex(c => c.id === cardId);
      if (idx === -1) return;
      const [card] = equipped.splice(idx, 1);
      vault.push(card);
    } else {
      if (equipped.length >= sheet.maxEquippedDomainCards) return;
      const idx = vault.findIndex(c => c.id === cardId);
      if (idx === -1) return;
      const [card] = vault.splice(idx, 1);
      equipped.push(card);
    }

    this.characterSheet.set({ ...sheet, equippedDomainCards: equipped, vaultDomainCards: vault });
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(sheet.id, {
        equippedDomainCardIds: equipped.map(c => c.id),
        vaultDomainCardIds: vault.map(c => c.id),
      })
      .subscribe({
        next: () => this.swapInFlight.set(false),
        error: () => {
          this.characterSheet.set(sheet);
          this.swapInFlight.set(false);
        },
      });
  }

  /**
   * Companion CRUD/Training orchestration. Unlike HP/Stress/Hope/Armor, these are their own REST
   * resource (not sheet PUT fields), so each action is an immediate optimistic write + rollback
   * on error, mirroring `swapDomainCard`'s shape rather than the `debounceTime` save pipelines
   * below -- there is no continuous-typing scenario here to coalesce, and per-companion
   * debouncing would need one `Subject` per companion id for no real benefit.
   */
  onCompanionCreated(submission: CompanionCreateSubmission): void {
    if (!this.canManageCompanions()) return;
    this.companionActionInFlight.set(true);
    this.companionError.set(null);
    this.companionService.createCompanion(submission.payload).subscribe({
      next: created => {
        this.companions.update(list => [...list, created]);
        this.companionActionInFlight.set(false);
        this.createCompanionExperiences(created.id, submission.experiences);
      },
      error: () => {
        this.companionActionInFlight.set(false);
        this.companionError.set('Failed to create companion.');
      },
    });
  }

  private createCompanionExperiences(companionId: number, experiences: Experience[]): void {
    for (const exp of experiences.filter(isExperienceComplete)) {
      this.characterSheetService.createExperience({
        companionId,
        description: exp.name,
        modifier: exp.modifier!,
      }).subscribe({
        next: created => {
          this.companions.update(list => list.map(c => c.id === companionId
            ? {
                ...c,
                experiences: [
                  ...(c.experiences ?? []),
                  { id: created.id, companionId, description: created.description, modifier: created.modifier },
                ],
              }
            : c));
        },
        error: () => { /* best-effort: the companion itself already exists either way */ },
      });
    }
  }

  onCompanionUpdated(submission: CompanionUpdateSubmission): void {
    if (!this.canManageCompanions()) return;
    const snapshot = this.companions().find(c => c.id === submission.id);
    this.companionActionInFlight.set(true);
    this.companionError.set(null);
    this.companionService.updateCompanion(submission.id, submission.payload).subscribe({
      next: updated => {
        this.companions.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.companionActionInFlight.set(false);
      },
      error: () => {
        this.companionActionInFlight.set(false);
        this.companionError.set('Failed to update companion.');
        if (snapshot) this.companions.update(list => list.map(c => c.id === snapshot.id ? snapshot : c));
      },
    });
  }

  onCompanionDeleted(companionId: number): void {
    if (!this.canManageCompanions()) return;
    const previous = this.companions();
    this.companionActionInFlight.set(true);
    this.companionError.set(null);
    this.companions.update(list => list.filter(c => c.id !== companionId));
    this.companionService.deleteCompanion(companionId).subscribe({
      next: () => this.companionActionInFlight.set(false),
      error: () => {
        this.companionActionInFlight.set(false);
        this.companionError.set('Failed to delete companion.');
        this.companions.set(previous);
      },
    });
  }

  onCompanionStressChanged(event: CompanionStressChangedEvent): void {
    if (!this.canManageCompanions()) return;
    const snapshot = this.companions().find(c => c.id === event.companionId);
    if (!snapshot) return;
    this.companions.update(list => list.map(c => c.id === event.companionId ? { ...c, stressMarked: event.stressMarked } : c));
    this.companionService.updateCompanion(event.companionId, { stressMarked: event.stressMarked }).subscribe({
      error: () => {
        this.companionError.set('Failed to update Stress.');
        this.companions.update(list => list.map(c => c.id === snapshot.id ? snapshot : c));
      },
    });
  }

  /** Routes through the existing Armor pipeline (`setResourceMarked`) rather than a
   * companion-specific one -- see recon §7. */
  onCompanionMarkArmorInstead(): void {
    const max = this.characterSheet()?.armorScore.modified ?? 0;
    this.setResourceMarked('armor', Math.min(this.markedArmor() + 1, max));
  }

  onCompanionTrainingAdded(event: CompanionTrainingAddedEvent): void {
    if (!this.canManageCompanions()) return;
    this.companionActionInFlight.set(true);
    this.companionError.set(null);
    this.companionService.addTraining(event.companionId, event.request).subscribe({
      next: updated => {
        this.companions.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.companionActionInFlight.set(false);
      },
      error: () => {
        this.companionActionInFlight.set(false);
        this.companionError.set('Failed to add training.');
      },
    });
  }

  onCompanionTrainingRemoved(event: CompanionTrainingRemovedEvent): void {
    if (!this.canManageCompanions()) return;
    this.companionActionInFlight.set(true);
    this.companionError.set(null);
    this.companionService.removeTraining(event.companionId, event.trainingId).subscribe({
      next: updated => {
        this.companions.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.companionActionInFlight.set(false);
      },
      error: () => {
        this.companionActionInFlight.set(false);
        this.companionError.set('Failed to remove training.');
      },
    });
  }

  onDismissCompanionError(): void {
    this.companionError.set(null);
  }

  private initSavePipelines(): void {
    this.healthSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const sheet = this.characterSheet()!;
        const snapshot = { hp: sheet.hitPointMarked, armor: sheet.armorMarked };
        this.markSaving('health');
        return this.characterSheetService.updateCharacterSheet(sheet.id, {
          hitPointMarked: this.markedHp(),
          armorMarked: this.markedArmor(),
        }).pipe(
          tap(() => {
            this.characterSheet.update(s => s ? { ...s, hitPointMarked: this.markedHp(), armorMarked: this.markedArmor() } : s);
            this.localHpMarked.set(null);
            this.localArmorMarked.set(null);
            this.clearSaving('health');
          }),
          catchError(() => {
            this.localHpMarked.set(snapshot.hp);
            this.localArmorMarked.set(snapshot.armor);
            this.clearSaving('health');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.hopeStressSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const sheet = this.characterSheet()!;
        const snapshot = { hope: sheet.hopeMarked, stress: sheet.stressMarked };
        this.markSaving('hopeStress');
        return this.characterSheetService.updateCharacterSheet(sheet.id, {
          hopeMarked: this.markedHope(),
          stressMarked: this.markedStress(),
        }).pipe(
          tap(() => {
            this.characterSheet.update(s => s ? { ...s, hopeMarked: this.markedHope(), stressMarked: this.markedStress() } : s);
            this.localHopeMarked.set(null);
            this.localStressMarked.set(null);
            this.clearSaving('hopeStress');
          }),
          catchError(() => {
            this.localHopeMarked.set(snapshot.hope);
            this.localStressMarked.set(snapshot.stress);
            this.clearSaving('hopeStress');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.goldSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const sheet = this.characterSheet()!;
        const goldSnapshot = this.localGoldAdjustment();
        this.markSaving('gold');
        return this.characterSheetService.updateCharacterSheet(sheet.id, {
          gold: this.currentGold(),
        }).pipe(
          tap(() => {
            this.characterSheet.update(s => s ? { ...s, gold: this.currentGold() } : s);
            this.localGoldAdjustment.set(0);
            this.clearSaving('gold');
          }),
          catchError(() => {
            this.localGoldAdjustment.set(goldSnapshot);
            this.clearSaving('gold');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.focusSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const raw = this.rawSheet();
        if (!raw) return EMPTY;
        const snapshot = raw.focusMarked;
        const newFocus = this.markedFocus();
        this.markSaving('focus');
        return this.characterSheetService.updateCharacterSheet(raw.id, {
          focusMarked: newFocus,
        }).pipe(
          tap(() => {
            this.rawSheet.update(s => s ? { ...s, focusMarked: newFocus } : s);
            this.localFocusMarked.set(null);
            this.clearSaving('focus');
          }),
          catchError(() => {
            this.localFocusMarked.set(snapshot ?? null);
            this.clearSaving('focus');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.favorSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const raw = this.rawSheet();
        if (!raw) return EMPTY;
        const snapshot = this.localFavor();
        const newFavor = this.currentFavor();
        this.markSaving('favor');
        return this.characterSheetService.updateCharacterSheet(raw.id, {
          favor: newFavor,
        }).pipe(
          tap(() => {
            this.rawSheet.update(s => s ? { ...s, favor: newFavor } : s);
            this.localFavor.set(null);
            this.clearSaving('favor');
          }),
          catchError(() => {
            this.localFavor.set(snapshot);
            this.clearSaving('favor');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.notesSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.canAccessNotes()) return EMPTY;
        const raw = this.rawSheet();
        if (!raw) return EMPTY;
        const snapshot = raw.notes ?? '';
        const pending = this.currentNotes();
        this.markSaving('notes');
        return this.characterSheetService
          .updateCharacterSheetNotes(raw.id, { notes: pending })
          .pipe(
            tap(response => {
              const newNotes = response.notes ?? '';
              this.rawSheet.update(s => s ? { ...s, notes: newNotes } : s);
              this.characterSheet.update(s => s ? { ...s, notes: newNotes } : s);
              this.localNotes.set(null);
              this.clearSaving('notes');
              this.notesSavedAt.set(Date.now());
            }),
            catchError(() => {
              this.localNotes.set(snapshot);
              this.clearSaving('notes');
              this.notesSavedAt.set(null);
              return EMPTY;
            }),
          );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private markSaving(section: string): void {
    this.savingSections.update(s => { const n = new Set(s); n.add(section); return n; });
  }

  private clearSaving(section: string): void {
    this.savingSections.update(s => { const n = new Set(s); n.delete(section); return n; });
  }
}
