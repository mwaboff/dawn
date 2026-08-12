import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CreatureComfortChoice, CreatureComfortChoices, RestCompanionState } from '../../models/rest.model';
import { isCompanionDowned } from '../../utils/rest-companion.utils';

export interface CreatureComfortChange {
  readonly companionId: number;
  /** Null clears the election -- "didn't use it this rest" is a real answer, not an absent one. */
  readonly choice: CreatureComfortChoice | null;
}

/** One row: the companion, its current election, and whether this rest is bringing it back. */
interface ComfortRow {
  readonly companion: RestCompanionState;
  readonly choice: CreatureComfortChoice | null;
  /** True only on a long rest for a companion currently out of the scene. */
  readonly returning: boolean;
  readonly name: string;
}

/**
 * The three answers, as data. Opting out is `null` rather than a third `CreatureComfortChoice`,
 * so an absent key stays the whole answer everywhere downstream.
 */
const COMFORT_OPTIONS: readonly { readonly value: CreatureComfortChoice | null; readonly label: string }[] = [
  { value: null, label: 'Don’t use it' },
  { value: 'hope', label: 'Gain a Hope' },
  { value: 'stress', label: 'You both clear a Stress' },
];

/** Ids and radio-group names must be document-unique across concurrent modals. */
let nextComfortId = 0;

/**
 * The Creature Comfort election, one group per companion holding the training.
 *
 * This is NOT a downtime move: it spends no slot, so it lives outside the move tray rather than in
 * the catalogue. It renders only when there is at least one companion to offer it for, which is why
 * the whole block is absent from every character without companions.
 */
@Component({
  selector: 'app-rest-creature-comfort',
  templateUrl: './rest-creature-comfort.html',
  styleUrl: './rest-creature-comfort.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestCreatureComfort {
  readonly companions = input.required<readonly RestCompanionState[]>();
  readonly choices = input.required<CreatureComfortChoices>();
  readonly restType = input.required<'short' | 'long'>();

  readonly choiceChanged = output<CreatureComfortChange>();

  private readonly uid = nextComfortId++;
  protected readonly headingId = `rest-comfort-heading-${this.uid}`;
  protected readonly options = COMFORT_OPTIONS;

  protected readonly rows = computed<readonly ComfortRow[]>(() =>
    this.companions().map(companion => ({
      companion,
      name: companion.name,
      choice: this.choices()[companion.id] ?? null,
      returning: this.restType() === 'long' && isCompanionDowned(companion),
    })),
  );

  protected groupName(companionId: number): string {
    return `rest-comfort-${this.uid}-${companionId}`;
  }

  protected optionId(companionId: number, value: CreatureComfortChoice | null): string {
    return `rest-comfort-${this.uid}-${companionId}-${value ?? 'none'}`;
  }

  protected onChoose(companionId: number, choice: CreatureComfortChoice | null): void {
    this.choiceChanged.emit({ companionId, choice });
  }
}
