import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
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
import { InventorySection } from '../character-sheet/components/inventory-section/inventory-section';
import { ItemCreateModal } from '../character-sheet/components/item-create-modal/item-create-modal';
import { ModifierIndicator } from '../character-sheet/components/modifier-indicator/modifier-indicator';
import { DiceRoller } from '../../shared/components/dice-roller/dice-roller';
import {
  ancestryCardToEntity,
  classCardToEntity,
  communityCardToEntity,
  domainCardToEntity,
  subclassCardToEntity,
} from './utils/entity-card.mapper';

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
 * hand-inlined `expandable-card` blocks (class/subclass/ancestry/community/equipped domain/vault
 * domain) become `EntityCard` grids; the four Hope & Fear panels swap for their beta siblings;
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
    InventorySection,
    ModifierIndicator,
    DiceRoller,
    DecimalPipe,
    LowerCasePipe,
    BeastformSectionBeta,
    MartialStancePanelBeta,
    TransformationPanelBeta,
    ResourceTracker,
    CompanionPanelBeta,
    ItemCreateModal,
    EntityCard,
  ],
})
export class CharacterSheetBeta extends CharacterSheet {
  readonly classCardEntities = computed<EntityCardData[]>(() =>
    (this.characterSheet()?.classCards ?? []).map(classCardToEntity),
  );
  readonly subclassCardEntities = computed<EntityCardData[]>(() =>
    (this.characterSheet()?.subclassCards ?? []).map(subclassCardToEntity),
  );
  readonly ancestryCardEntities = computed<EntityCardData[]>(() =>
    (this.characterSheet()?.ancestryCards ?? []).map(ancestryCardToEntity),
  );
  readonly communityCardEntities = computed<EntityCardData[]>(() =>
    (this.characterSheet()?.communityCards ?? []).map(communityCardToEntity),
  );
  readonly equippedDomainCardEntries = computed<DomainCardEntry[]>(() =>
    (this.characterSheet()?.equippedDomainCards ?? []).map(card => ({ cardId: card.id, card: domainCardToEntity(card) })),
  );
  readonly vaultDomainCardEntries = computed<DomainCardEntry[]>(() =>
    (this.characterSheet()?.vaultDomainCards ?? []).map(card => ({ cardId: card.id, card: domainCardToEntity(card) })),
  );
}
