import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { BeastformSection, BeastformView } from '../../../character-sheet/components/beastform-section/beastform-section';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { CollapsibleCardGroup } from '../collapsible-card-group/collapsible-card-group';
import { EntityCardData, EntityCardFeature } from '../../../../shared/components/entity-card/entity-card.model';

interface BeastformCardEntry {
  /** Kept alongside `card` because `EntityCardData.id` is `string | number` and the inherited
   * `isFormExpanded()`/`toggleForm()` require the original `number`. */
  readonly formId: number;
  readonly card: EntityCardData;
}

let nextInstanceId = 0;

/**
 * No `stats` ledger here on purpose. `BeastformView` exposes only `statLine`/`attackLine` -- the
 * traits, evasion and damage are joined into those two strings by `toBeastformView` and the
 * per-field values never reach this layer, so populating label/value stat cells would mean
 * re-deriving (and re-formatting) numbers that the classic view model already owns. `statLine` is
 * the card's `headline`, which only renders at `compact` size, and the attack line stays a `meta`
 * row because it is words rather than numbers.
 *
 * A restricted form short-circuits to the same 4-field locked shape every other `EntityCardData`
 * mapper in this app returns -- `EntityCard` draws the locked face itself off `restricted`/
 * `expansionName`, so this stops short of a fabricated `Tier undefined` badge (`form.tier` is
 * genuinely absent on a redacted stub, and `String(undefined)` would otherwise print the word
 * "undefined" as if it were real data).
 */
function toEntityCard(form: BeastformView): EntityCardData {
  if (form.restricted) return { id: form.id, cardType: 'beastform', restricted: true, expansionName: form.expansionName };

  const features: EntityCardFeature[] = [
    ...(form.advantages ? [{ name: 'Gain advantage on', description: form.advantages }] : []),
    ...form.features.map(feature => ({ name: feature.name, description: feature.description })),
  ];

  return {
    id: form.id,
    name: form.name,
    cardType: 'beastform',
    headline: form.statLine ?? undefined,
    badges: form.tier !== undefined ? [{ label: 'Tier', value: String(form.tier) }] : undefined,
    meta: form.attackLine ? [{ label: 'Attack', value: form.attackLine }] : undefined,
    features,
  };
}

/**
 * Beta rendering of {@link BeastformSection}: same inherited loading/tier-filtering/expansion
 * state, a new template and stylesheet only. The nested expandable-card-within-expandable-card
 * layout becomes a grid of `EntityCard`s -- each form's own disclosure (attack line, advantages,
 * features) is now the card's own compact/normal/expanded toggle rather than a hand-rolled nested
 * `expandable-card`.
 */
@Component({
  selector: 'app-beastform-section-beta',
  templateUrl: './beastform-section-beta.html',
  styleUrl: './beastform-section-beta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard, CollapsibleCardGroup],
})
export class BeastformSectionBeta extends BeastformSection {
  /** Per-instance, not a static string -- a hard-coded id collides the moment a second section
   * renders on the same page (this is the same bug class `EntityCard`'s body id had to fix). */
  protected readonly bodyId = `beastform-body-${nextInstanceId++}`;

  readonly beastformCards = computed<BeastformCardEntry[]>(() =>
    this.beastforms().map(form => ({ formId: form.id, card: toEntityCard(form) })),
  );
}
