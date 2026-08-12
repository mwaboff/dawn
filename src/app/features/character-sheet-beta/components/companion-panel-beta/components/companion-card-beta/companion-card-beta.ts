import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CompanionCard } from '../../../../../character-sheet/components/companion-panel/components/companion-card/companion-card';
import {
  TakenCompanionTraining,
  groupCompanionTrainings,
} from '../../../../../character-sheet/components/companion-panel/components/companion-training-list/companion-training-list.model';
import { EntityCard } from '../../../../../../shared/components/entity-card/entity-card';
import { EntityCardData, EntityCardFeature } from '../../../../../../shared/components/entity-card/entity-card.model';
import { ResourceTracker } from '../../../../../../shared/components/resource-tracker/resource-tracker';
import { InlineDeleteConfirm } from '../../../../../../shared/components/inline-delete-confirm/inline-delete-confirm';

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * One taken Training as an `EntityCardFeature`: name and rules text, the same shape every other
 * feature on this card uses.
 *
 * The repeat count rides in the name because `EntityCardFeature` has no slot of its own for it, and
 * it is the same "Taken 2 of 3" wording the classic list renders -- shared via `countLabel` rather
 * than formatted twice, so the two cards can never word it differently.
 */
function trainingFeature(training: TakenCompanionTraining): EntityCardFeature {
  return {
    name: training.countLabel ? `${training.label} — ${training.countLabel}` : training.label,
    description: training.effect,
    ...(training.viciousAxes.length > 0 ? { tags: [...training.viciousAxes] } : {}),
  };
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
 * reminders all fold into `card().features` instead. Each taken Training is its own feature, name
 * and rules text like every other entry, grouped by `groupCompanionTrainings` so a thrice-taken
 * Vicious is one entry carrying its count rather than three copies of the same paragraph. The
 * grouping and the rules text are shared with `CompanionTrainingList` rather than re-derived; the
 * component itself can't be embedded here, since `EntityCard`'s only `ng-content` slots are
 * `[card-controls]`/`[card-actions]`, both meant for interactive content and both rendered outside
 * the clipped body.
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
      ...groupCompanionTrainings(companion.trainings).map(trainingFeature),
      ...this.reminders().map(text => ({ description: text })),
      ...this.classFeatureReminders().map(feature => ({ name: feature.label, description: feature.text })),
    ];

    return {
      id: companion.id,
      name: companion.name,
      cardType: 'companion',
      /** `headline` renders only at `compact` size and `meta` only in the body, so the attack line
       * is never on screen twice -- the same compact/body split every other beta mapper uses. */
      headline: attackLine,
      description: companion.description,
      /** A companion has no tier or level, so both chips are live state: Stress first because it
       * changes constantly, then the out-of-scene flag. */
      badges: [
        { label: 'Stress', value: `${companion.stressMarked}/${companion.stressMax}` },
        ...(companion.outOfScene ? [{ label: 'Out of scene' }] : []),
      ],
      stats: [{ label: 'Evasion', value: String(companion.evasion) }],
      meta: [{ label: 'Attack', value: attackLine }],
      features,
    };
  });
}
