import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CompanionCard } from '../../../../../character-sheet/components/companion-panel/components/companion-card/companion-card';
import { COMPANION_TRAINING_LABELS, VICIOUS_AXIS_LABELS } from '../../../../../character-sheet/components/companion-panel/components/companion-training-list/companion-training-list.model';
import { EntityCard } from '../../../../../../shared/components/entity-card/entity-card';
import { EntityCardData, EntityCardFeature } from '../../../../../../shared/components/entity-card/entity-card.model';
import { ResourceTracker } from '../../../../../../shared/components/resource-tracker/resource-tracker';
import { InlineDeleteConfirm } from '../../../../../../shared/components/inline-delete-confirm/inline-delete-confirm';
import { CompanionTrainingApiResponse } from '../../../../../../shared/models/companion-api.model';

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/** Mirrors `companion-training-list.html`'s own formatting -- reusing the shared
 * `COMPANION_TRAINING_LABELS`/`VICIOUS_AXIS_LABELS` lookups (not re-deriving the labels) rather
 * than the `CompanionTrainingList` component itself, which has no slot to render into here; see
 * the class doc comment below. */
function formatTraining(training: CompanionTrainingApiResponse): string {
  const label = COMPANION_TRAINING_LABELS[training.option];
  return training.viciousAxis ? `${label} (${VICIOUS_AXIS_LABELS[training.viciousAxis]})` : label;
}

/**
 * Beta rendering of {@link CompanionCard}: same inherited expand/edit/delete/stress state and
 * every mutating handler -- only the template and stylesheet change, from the sheet's bespoke
 * expandable-card to a shared `EntityCard`.
 *
 * The Stress `ResourceTracker` and the Armored training's "mark Armor instead" prompt move into
 * `[card-controls]`; Edit and the `InlineDeleteConfirm` move into `[card-actions]`. Both slots
 * render outside `EntityCard`'s clipped body, so the Stress tracker -- previously inside the
 * classic card's collapsible region, reachable by tab order but invisible while collapsed -- is
 * now reachable without expanding the card first. That's a real fix, not a deliberate redesign;
 * see the "keeps the Stress tracker reachable" spec.
 *
 * Experiences, taken Training, and the Bonded/Creature Comfort/Battle-Bonded/Loyal Friend
 * reminders all fold into `card().features` instead. Training in particular collapses to one
 * "Training" feature summarising every taken option, because `EntityCardFeature.description` is
 * required and a bare label-only entry (no rules text at this point -- the full effect text only
 * shows during the level-up wizard's `TrainingStep`) has nowhere else to go without either
 * embedding the whole `CompanionTrainingList` component (which has no read-only body slot to
 * render into -- `EntityCard`'s only two `ng-content` slots are `[card-controls]`/`[card-actions]`,
 * both meant for interactive content and both rendered outside the clip) or re-deriving its label
 * map by hand. This reuses that map instead of duplicating it.
 */
@Component({
  selector: 'app-companion-card-beta',
  templateUrl: './companion-card-beta.html',
  styleUrl: './companion-card-beta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard, ResourceTracker, InlineDeleteConfirm],
})
export class CompanionCardBeta extends CompanionCard {
  readonly cardData = computed<EntityCardData>(() => {
    const companion = this.companion();
    const attackLine = this.attackLine();

    const features: EntityCardFeature[] = [
      ...(companion.experiences ?? []).map(exp => ({
        name: formatModifier(exp.modifier),
        description: exp.description,
      })),
      ...(companion.trainings.length > 0
        ? [{ name: 'Training', description: companion.trainings.map(formatTraining).join(', ') }]
        : []),
      ...this.reminders().map(text => ({ description: text })),
      ...this.classFeatureReminders().map(feature => ({ name: feature.label, description: feature.text })),
    ];

    return {
      id: companion.id,
      name: companion.name,
      cardType: 'companion',
      headline: attackLine,
      description: companion.description,
      badges: [
        { label: 'Stress', value: `${companion.stressMarked}/${companion.stressMax}` },
        ...(companion.outOfScene ? [{ label: 'Out of scene' }] : []),
      ],
      meta: [
        { label: 'Evasion', value: String(companion.evasion) },
        { label: 'Attack', value: attackLine },
      ],
      features,
    };
  });
}
