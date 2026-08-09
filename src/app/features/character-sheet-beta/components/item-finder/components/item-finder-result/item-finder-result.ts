import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EntityCard } from '../../../../../../shared/components/entity-card/entity-card';
import {
  CatalogCardEntry,
  PROVENANCE_DESCRIPTIONS,
  PROVENANCE_LABELS,
} from '../../../../utils/catalog-card.mapper';

/**
 * One row of the item finder: the item drawn as a `compact` EntityCard -- a single line of name,
 * type and one fact -- that expands in place to the full card when the player wants the rules text.
 * Everything below the header is hidden until then, so a search can list gear of three different
 * kinds without any one result crowding out the rest.
 *
 * The Add button and the chips are projected into `[card-controls]`, which EntityCard renders
 * outside its clipped body: they stay visible and clickable while the card is collapsed.
 */
@Component({
  selector: 'app-item-finder-result',
  templateUrl: './item-finder-result.html',
  styleUrl: './item-finder-result.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard],
})
export class ItemFinderResult {
  readonly entry = input.required<CatalogCardEntry>();
  /** Whether this item was already added during this visit to the finder. */
  readonly added = input(false);

  readonly add = output<CatalogCardEntry>();

  readonly provenanceLabel = computed(() => {
    const provenance = this.entry().provenance;
    return provenance ? PROVENANCE_LABELS[provenance] : null;
  });

  /**
   * "Add Broadsword, custom gear you created, to inventory". The chip beside the button is a
   * two-word shorthand that only makes sense next to the card it belongs to, so the button's own
   * name spells the whole thing out rather than leaving a screen reader to stitch them together.
   *
   * It opens with the visible word so the name contains the label (WCAG 2.5.3), which is also why
   * the button keeps saying "Add" after an add rather than switching to "Add again" -- an action
   * that renames itself mid-flow is a different action as far as a speech-input user is concerned.
   * The row carries the state instead, in the Added chip.
   */
  readonly addLabel = computed(() => {
    const entry = this.entry();
    const provenance = entry.provenance;
    const origin = provenance ? `, ${PROVENANCE_DESCRIPTIONS[provenance]},` : '';
    const repeat = this.added() ? ' again' : '';
    return `Add ${entry.name}${origin} to inventory${repeat}`;
  });
}
