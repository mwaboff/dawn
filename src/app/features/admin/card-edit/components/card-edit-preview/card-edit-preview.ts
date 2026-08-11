import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { EntityCard } from '../../../../../shared/components/entity-card/entity-card';
import { EntityCardData } from '../../../../../shared/components/entity-card/entity-card.model';

/**
 * The preview draws the shared `EntityCard`, the same face the beta sheet, the reference browser and
 * the encounter builder render -- an editor that previews a card in a design the site no longer
 * ships is showing the admin something they cannot go and look at.
 *
 * The card arrives already mapped (`buildPreviewEntityCard`), which is where the per-type decision
 * about how faithful a preview can be lives -- adversaries get a real stat ledger, everything else
 * gets what its form actually holds. This component only sticks it to the top of the page.
 */
@Component({
  selector: 'app-card-edit-preview',
  templateUrl: './card-edit-preview.html',
  styleUrl: './card-edit-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard],
})
export class CardEditPreview {
  readonly card = input<EntityCardData | null>(null);
}
