import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { BeastformSection, BeastformView } from '../../../character-sheet/components/beastform-section/beastform-section';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { EntityCardData, EntityCardFeature } from '../../../../shared/components/entity-card/entity-card.model';

interface BeastformCardEntry {
  /** Kept alongside `card` because `EntityCardData.id` is `string | number` and the inherited
   * `isFormExpanded()`/`toggleForm()` require the original `number`. */
  readonly formId: number;
  readonly card: EntityCardData;
}

let nextInstanceId = 0;

function toEntityCard(form: BeastformView): EntityCardData {
  const features: EntityCardFeature[] = [
    ...(form.advantages ? [{ name: 'Gain advantage on', description: form.advantages }] : []),
    ...form.features.map(feature => ({ name: feature.name, description: feature.description })),
  ];

  return {
    id: form.id,
    name: form.name,
    cardType: 'beastform',
    headline: form.statLine ?? undefined,
    badges: [{ label: 'Tier', value: String(form.tier) }],
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
  imports: [EntityCard],
})
export class BeastformSectionBeta extends BeastformSection {
  /** Per-instance, not a static string -- a hard-coded id collides the moment a second section
   * renders on the same page (this is the same bug class `EntityCard`'s body id had to fix). */
  protected readonly bodyId = `beastform-body-${nextInstanceId++}`;

  readonly beastformCards = computed<BeastformCardEntry[]>(() =>
    this.beastforms().map(form => ({ formId: form.id, card: toEntityCard(form) })),
  );
}
