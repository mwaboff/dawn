import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardData } from '../../../../../daggerheart-card/daggerheart-card.model';
import { CardFeatureItem } from '../../../../../daggerheart-card/card-feature-item/card-feature-item';

/**
 * The environment's read-only detail, revealed under its row on expand -- the same expanded-
 * content role as `RunAdversaryDetail`, but with none of that component's interactive controls:
 * an environment has no HP, Stress, tokens, or defeated state (Core ch. 4 only ever prints Tier,
 * Type, Difficulty, Impulses, Potential Adversaries, and Features for one), so there's nothing
 * here to mark or mutate. Purely presentational, closer in spirit to `party-member-detail`.
 */
@Component({
  selector: 'app-run-environment-detail',
  templateUrl: './run-environment-detail.html',
  styleUrls: ['../../../run-stat-row/run-detail-shell.css', './run-environment-detail.css'],
  imports: [CardFeatureItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunEnvironmentDetail {
  readonly card = input.required<CardData>();
  /** How a GM plays the scene moment to moment -- not part of `CardData.metadata`'s standard
   * surface, so `RunEnvironmentPanel` reads it out and passes it down directly. */
  readonly impulses = input<string>();
  readonly potentialAdversaries = input<string>();
}
