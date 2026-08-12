import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CharacterSheet } from '../character-sheet/character-sheet';
import { SavingSpinner } from '../../shared/components/saving-spinner/saving-spinner';
import { ResourceTracker } from '../../shared/components/resource-tracker/resource-tracker';
import { FormatTextPipe } from '../../shared/pipes/format-text.pipe';
import { EntityCard } from '../../shared/components/entity-card/entity-card';
import { EntityCardData } from '../../shared/components/entity-card/entity-card.model';
import { BeastformSectionBeta } from './components/beastform-section-beta/beastform-section-beta';
import { MartialStancePanelBeta } from './components/martial-stance-panel-beta/martial-stance-panel-beta';
import { TransformationPanelBeta } from './components/transformation-panel-beta/transformation-panel-beta';
import { CompanionPanelBeta } from './components/companion-panel-beta/companion-panel-beta';
import { InventoryEditEvent } from '../character-sheet/components/inventory-section/inventory-section';
import { ItemCreatedEvent, ItemFormModal } from '../character-sheet/components/item-form-modal/item-form-modal';
import { InventorySectionBeta } from './components/inventory-section-beta/inventory-section-beta';
import { ItemKind } from '../../shared/utils/item-routes.utils';
import { ModifierIndicator } from '../character-sheet/components/modifier-indicator/modifier-indicator';
import { DiceRoller } from '../../shared/components/dice-roller/dice-roller';
import { CollapsibleCardGroup } from './components/collapsible-card-group/collapsible-card-group';
import { DiceRollerService } from '../../core/services/dice-roller.service';
import { RollOptionsDirective, RollOption } from '../../shared/components/roll-options/roll-options.directive';
import { buildTraitRollRequest, buildWeaponDamageRollRequest } from '../character-sheet/utils/roll-request.utils';
import { TraitDisplay } from '../character-sheet/models/character-sheet-view.model';
import { RollRequest } from '../../shared/models/dice-roller.model';
import {
  ancestryCardToEntity,
  classCardToEntity,
  communityCardToEntity,
  domainCardToEntity,
  subclassCardToEntity,
} from './utils/entity-card.mapper';
import { orderClassGroupCards } from './utils/card-group-order.utils';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { RestControl } from './components/rest/rest-control';
import { RestApplyResult, RestMoveAccess, RestOutcome } from './components/rest/models/rest.model';
import {
  applyRestToRaw,
  applyRestToView,
  restUpdateRequest,
  toRestCharacterState,
} from './components/rest/utils/rest-state.mapper';

/** Pairs a mapped `EntityCardData` with the original numeric id `onVaultCard`/`onEquipCard`
 * (inherited from `CharacterSheet`) need -- `EntityCardData.id` is `string | number` and isn't
 * guaranteed to round-trip, so the raw id travels alongside rather than being parsed back out. */
interface DomainCardEntry {
  readonly cardId: number;
  readonly card: EntityCardData;
}

/**
 * Beta rendering of {@link CharacterSheet}: same inherited data loading, save pipelines, equip
 * constraints and every handler -- a new template and stylesheet only, nothing else. The six
 * hand-inlined `expandable-card` blocks become four collapsible `EntityCard` grids -- class and
 * subclass share a group, as do ancestry and community; the four Hope & Fear panels swap for their beta siblings;
 * the inventory manager and the Equipped Armor panel stay classic, deferred to a later rework.
 * Equipped Weapons keeps its classic card markup too, except the damage stat, which is now a
 * click-to-roll button (see `onRollTrait`/`onRollWeaponDamage` below) -- attack rolls and
 * inventory/catalogue weapon rows are still deferred.
 */
@Component({
  selector: 'app-character-sheet-beta',
  templateUrl: './character-sheet-beta.html',
  styleUrls: [
    './character-sheet-beta.css',
    './character-sheet-beta-traits.css',
    './character-sheet-beta-layout.css',
    './character-sheet-beta-cards.css',
    './character-sheet-beta-equipment.css',
    './character-sheet-beta-notes.css',
    './character-sheet-beta-rest.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SavingSpinner,
    RouterLink,
    FormatTextPipe,
    InventorySectionBeta,
    ModifierIndicator,
    DiceRoller,
    DecimalPipe,
    LowerCasePipe,
    BeastformSectionBeta,
    MartialStancePanelBeta,
    TransformationPanelBeta,
    ResourceTracker,
    CompanionPanelBeta,
    ItemFormModal,
    EntityCard,
    CollapsibleCardGroup,
    RollOptionsDirective,
    RestControl,
  ],
})
export class CharacterSheetBeta extends CharacterSheet {
  /**
   * A second reference to the same `providedIn: 'root'` singleton `CharacterSheet` already
   * injects -- that one is `private` on the base class, so it isn't reachable from here, and
   * roll handlers must live on `CharacterSheetBeta` only (never the base) or they would leak
   * into classic.
   */
  private readonly diceRoller = inject(DiceRollerService);

  /** Same story as `diceRoller`: the base class holds this singleton privately. */
  private readonly sheets = inject(CharacterSheetService);

  /** Class cards then their subclass cards, one combined "Class & Subclass" group -- ordering
   * rules and the class-to-subclass linkage live in `orderClassGroupCards`. */
  readonly classGroupCardEntities = computed<EntityCardData[]>(() => {
    const sheet = this.characterSheet();
    return orderClassGroupCards(sheet?.classCards ?? [], sheet?.subclassCards ?? []).map(entry =>
      entry.kind === 'class' ? classCardToEntity(entry.card) : subclassCardToEntity(entry.card),
    );
  });
  /** Ancestry before community, one combined "Ancestry & Community" group. */
  readonly heritageCardEntities = computed<EntityCardData[]>(() => {
    const sheet = this.characterSheet();
    return [
      ...(sheet?.ancestryCards ?? []).map(ancestryCardToEntity),
      ...(sheet?.communityCards ?? []).map(communityCardToEntity),
    ];
  });
  readonly equippedDomainCardEntries = computed<DomainCardEntry[]>(() =>
    (this.characterSheet()?.equippedDomainCards ?? []).map(card => ({ cardId: card.id, card: domainCardToEntity(card) })),
  );
  readonly vaultDomainCardEntries = computed<DomainCardEntry[]>(() =>
    (this.characterSheet()?.vaultDomainCards ?? []).map(card => ({ cardId: card.id, card: domainCardToEntity(card) })),
  );

  /**
   * Null hides the damage-roll affordance instead of wiring up a roll that would do nothing --
   * see `buildWeaponDamageRollRequest` for the cases that return null (no damage data, an
   * unparseable `diceType`, or a resolved dice count of zero). Two dedicated `computed()`s rather
   * than a per-weapon method, since only these two weapon slots ever feed a roll button here
   * (inventory/catalogue weapon rows are out of scope this phase -- see the class doc comment).
   */
  readonly primaryWeaponDamageRequest = computed<RollRequest | null>(() => {
    const sheet = this.characterSheet();
    const weapon = sheet?.activePrimaryWeapon;
    return weapon ? buildWeaponDamageRollRequest(weapon, sheet!.proficiency.modified) : null;
  });
  readonly secondaryWeaponDamageRequest = computed<RollRequest | null>(() => {
    const sheet = this.characterSheet();
    const weapon = sheet?.activeSecondaryWeapon;
    return weapon ? buildWeaponDamageRollRequest(weapon, sheet!.proficiency.modified) : null;
  });

  /**
   * What the item dialog is doing: building a new item of `kind`, or editing the existing `itemId`.
   * One signal rather than two so the template mounts the dialog once -- two `@if` blocks over the
   * same component is the duplicated-branch pattern `.agents/rules/component-design.md` rules out.
   */
  readonly itemModalRequest = signal<{ kind: ItemKind; itemId: number | null } | null>(null);

  override setCreatingItemKind(kind: ItemKind | null): void {
    this.itemModalRequest.set(kind ? { kind, itemId: null } : null);
  }

  /**
   * Homebrew is edited in place here, where `CharacterSheet` navigates to the routed builder.
   * Staying on the sheet is the point of the card's Edit button -- the warning the builder page
   * carries in prose (an edit applies everywhere the item is used) moves into the dialog with it.
   */
  override onEditInventoryItem(event: InventoryEditEvent): void {
    this.itemModalRequest.set({ kind: event.type, itemId: event.itemId });
  }

  onItemModalCreated(event: ItemCreatedEvent): void {
    this.itemModalRequest.set(null);
    this.onAddInventoryItem(event);
  }

  /**
   * Rolls a trait: a plain click (the default `'normal'`) rolls with no advantage state, and the
   * `appRollOptions` menu's `rollOptionSelected` output calls this again with the picked option.
   * Anyone viewing the sheet can trigger a roll -- rolling is read-only, so this is deliberately
   * not gated on `isOwner()`.
   */
  onRollTrait(trait: TraitDisplay, option: RollOption = 'normal'): void {
    const advantage = option === 'normal' ? undefined : option;
    this.diceRoller.externalTrigger(buildTraitRollRequest(trait, advantage));
  }

  /**
   * The template only ever renders a damage-roll button once `primaryWeaponDamageRequest`/
   * `secondaryWeaponDamageRequest` has already returned non-null (see `character-sheet-beta.html`),
   * so the request is built once there and handed back here rather than rebuilt a second time.
   */
  onRollWeaponDamage(request: RollRequest): void {
    this.diceRoller.externalTrigger(request);
  }

  /**
   * An edit changes the catalogue item, not the inventory entry pointing at it, so there is nothing
   * to send -- the sheet just has to re-read what it now says.
   */
  onItemModalUpdated(): void {
    this.itemModalRequest.set(null);
    const id = this.characterSheet()?.id;
    if (id !== undefined) this.loadCharacterSheet(id);
  }

  /** Null while the modal is closed or a rest is in flight; drives its summary-or-retry step. */
  readonly restApply = signal<RestApplyResult | null>(null);

  /**
   * True when a companion write from the rest just taken failed. Scoped to this rest by
   * `onRestSubmitted` clearing `companionError` before it saves anything.
   */
  readonly restCompanionSaveFailed = computed(() => this.companionError() !== null);

  /** The two gated downtime moves, reusing the predicates the header shields already run on. */
  readonly restAccess = computed<RestMoveAccess>(() => ({
    warlockResources: this.showWarlockResources(),
    martialStances: this.showMartialStances(),
  }));

  /**
   * Read from the optimistic computeds rather than the raw response, so a pip toggled within the
   * last 800ms is what the rest clears.
   */
  readonly restState = computed(() =>
    toRestCharacterState({
      view: this.characterSheet(),
      raw: this.rawSheet(),
      hitPointMarked: this.markedHp(),
      stressMarked: this.markedStress(),
      armorMarked: this.markedArmor(),
      hopeHeld: this.markedHope(),
      hopeCap: (this.characterSheet()?.hopeMax.modified ?? 0) + this.companionGrantedHopeSlots(),
      focusHeld: this.markedFocus(),
      focusMax: this.focusMax(),
      favor: this.currentFavor(),
      companions: this.companions(),
    }),
  );

  /**
   * The rest's one write. Follows `onActivateMartialStance`'s immediate-write shape: guard on
   * owner and in-flight, set both state signals optimistically, PUT, roll both back on error.
   *
   * Nulling the six overrides is not optional. A pip toggled in the last 800ms leaves an override
   * that `markedHp()` and friends still read and that the pending debounced pipeline will PUT when
   * it fires -- silently reverting the whole rest. Cleared, any pipeline that fires afterwards
   * re-sends the post-rest values instead, which is a no-op.
   */
  onRestSubmitted(outcome: RestOutcome): void {
    const raw = this.rawSheet();
    const view = this.characterSheet();
    if (!raw || !view || !this.isOwner() || this.hfActionInFlight()) return;

    // Cleared up front, not inside `saveRestCompanions`, so that whatever `restCompanionSaveFailed`
    // reports on the summary belongs to THIS rest -- including the rest that writes no companion at
    // all, which must not inherit the banner from an earlier companion edit that failed.
    this.companionError.set(null);

    // Nothing moved, so there is nothing to save -- go straight to an honest summary.
    if (outcome.unchanged) {
      this.restApply.set({ status: 'saved' });
      return;
    }

    // A rest that only cleared companion Stress has nothing left to send for the sheet itself.
    const request = restUpdateRequest(outcome.changes, outcome.previous);
    if (Object.keys(request).length === 0) {
      this.saveRestCompanions(outcome);
      this.restApply.set({ status: 'saved' });
      return;
    }

    this.rawSheet.set(applyRestToRaw(raw, outcome.changes));
    this.characterSheet.set(applyRestToView(view, outcome.changes));
    this.localHpMarked.set(null);
    this.localStressMarked.set(null);
    this.localHopeMarked.set(null);
    this.localArmorMarked.set(null);
    this.localFocusMarked.set(null);
    this.localFavor.set(null);
    this.hfActionInFlight.set(true);
    this.restApply.set(null);

    this.sheets.updateCharacterSheet(raw.id, request).subscribe({
      next: () => {
        this.saveRestCompanions(outcome);
        this.hfActionInFlight.set(false);
        this.restApply.set({ status: 'saved' });
      },
      error: () => {
        this.rawSheet.set(raw);
        this.characterSheet.set(view);
        this.hfActionInFlight.set(false);
        this.restApply.set({ status: 'error' });
      },
    });
  }

  /**
   * The rest's companion writes: one PUT per companion whose Stress moved, routed through
   * `onCompanionStressChanged` for its optimistic update, per-companion rollback and error banner.
   *
   * Fired only once the sheet write has been accepted, never before. A failed sheet write leaves
   * the modal on the moves step with its selections and Creature Comfort elections intact, and a
   * resubmit re-resolves the rest against the LIVE companion state -- so a companion cleared ahead
   * of a failure would be cleared a second time by the retry, spending one once-per-rest Creature
   * Comfort twice. Deferring them also makes the modal's "nothing on your sheet changed" message
   * true, since on the failure path nothing has been written anywhere.
   *
   * A write that fails rolls its own companion back and raises `companionError`, which the rest's
   * summary reports through `restCompanionSaveFailed` -- the sheet's banner sits behind the open
   * modal, so on its own it would let the summary claim a clear that never persisted.
   */
  private saveRestCompanions(outcome: RestOutcome): void {
    for (const change of outcome.companionChanges) {
      this.onCompanionStressChanged({ companionId: change.id, stressMarked: change.stressMarked });
    }
  }
}
