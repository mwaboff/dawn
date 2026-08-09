import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
import { ItemKind } from '../items/item-routes';
import { ModifierIndicator } from '../character-sheet/components/modifier-indicator/modifier-indicator';
import { DiceRoller } from '../../shared/components/dice-roller/dice-roller';
import { CollapsibleCardGroup } from './components/collapsible-card-group/collapsible-card-group';
import {
  ancestryCardToEntity,
  classCardToEntity,
  communityCardToEntity,
  domainCardToEntity,
  subclassCardToEntity,
} from './utils/entity-card.mapper';
import { orderClassGroupCards } from './utils/card-group-order.utils';

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
 * equipment display and the inventory manager stay classic, deferred to a later rework.
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
  ],
})
export class CharacterSheetBeta extends CharacterSheet {
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
   * An edit changes the catalogue item, not the inventory entry pointing at it, so there is nothing
   * to send -- the sheet just has to re-read what it now says.
   */
  onItemModalUpdated(): void {
    this.itemModalRequest.set(null);
    const id = this.characterSheet()?.id;
    if (id !== undefined) this.loadCharacterSheet(id);
  }
}
