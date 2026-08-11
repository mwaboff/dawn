import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  BASE_REST_MOVES,
  MAX_REST_MOVES,
  RestMoveDefinition,
  RestMoveTarget,
  RestSelection,
  RestType,
} from '../../models/rest.model';
import { REST_MOVES_BY_ID } from '../../utils/rest-catalog';
import { RestSelectionChip } from '../rest-selection-chip/rest-selection-chip';

/** A chosen slot paired with the definition it points at, so the template never looks moves up. */
export interface RestSelectionView {
  readonly selection: RestSelection;
  readonly definition: RestMoveDefinition;
}

export interface RestTargetChange {
  readonly key: string;
  readonly target: RestMoveTarget;
}

export interface RestPartyChange {
  readonly key: string;
  readonly withParty: boolean;
}

@Component({
  selector: 'app-rest-moves-step',
  imports: [RestSelectionChip],
  templateUrl: './rest-moves-step.html',
  styleUrls: ['../../rest-step.css', './rest-moves-step.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestMovesStep {
  readonly restType = input.required<RestType>();
  readonly moves = input.required<readonly RestMoveDefinition[]>();
  readonly selections = input.required<readonly RestSelection[]>();
  readonly slots = input.required<number>();
  readonly useLongRestMove = input(false);

  readonly moveAdded = output<RestMoveDefinition>();
  readonly moveRemoved = output<string>();
  readonly targetChanged = output<RestTargetChange>();
  readonly withPartyChanged = output<RestPartyChange>();
  readonly slotsChanged = output<number>();
  readonly longRestMoveToggled = output<boolean>();

  protected readonly heading = computed(() =>
    this.restType() === 'short' ? 'Short rest' : 'Long rest',
  );

  protected readonly chosen = computed<readonly RestSelectionView[]>(() =>
    this.selections().map(selection => ({
      selection,
      definition: REST_MOVES_BY_ID[selection.moveId],
    })),
  );

  /** Placeholder rows for the slots still to fill, so the tray shows what is owed. */
  protected readonly emptySlots = computed(() =>
    Array.from({ length: Math.max(0, this.slots() - this.selections().length) }, (_, i) => i),
  );

  protected readonly full = computed(() => this.selections().length >= this.slots());
  protected readonly canRemoveSlot = computed(() => this.slots() > BASE_REST_MOVES);
  protected readonly canAddSlot = computed(() => this.slots() < MAX_REST_MOVES);
}
