import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  BASE_REST_MOVES,
  CreatureComfortChoices,
  MAX_REST_MOVES,
  RestCompanionState,
  RestMoveDefinition,
  RestMoveTarget,
  RestSelection,
  RestType,
} from '../../models/rest.model';
import { REST_MOVES_BY_ID } from '../../utils/rest-catalog';
import { RestSelectionChip } from '../rest-selection-chip/rest-selection-chip';
import { CreatureComfortChange, RestCreatureComfort } from '../rest-creature-comfort/rest-creature-comfort';

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

/** Ids must be document-unique; two instances of this step would otherwise collide. */
let nextStepId = 0;

@Component({
  selector: 'app-rest-moves-step',
  imports: [RestSelectionChip, RestCreatureComfort],
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
  /**
   * Companions eligible for a Creature Comfort election this rest. Defaulted rather than required
   * because empty is the honest answer for every character without companions, and an empty list
   * is what keeps the block off their rest entirely.
   */
  readonly comfortCandidates = input<readonly RestCompanionState[]>([]);
  readonly comfortChoices = input<CreatureComfortChoices>({});

  readonly moveAdded = output<RestMoveDefinition>();
  readonly comfortChanged = output<CreatureComfortChange>();
  readonly moveRemoved = output<string>();
  readonly targetChanged = output<RestTargetChange>();
  readonly withPartyChanged = output<RestPartyChange>();
  readonly slotsChanged = output<number>();
  readonly longRestMoveToggled = output<boolean>();

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

  private readonly uid = nextStepId++;
  protected readonly slotLabelId = `rest-slot-label-${this.uid}`;
  protected readonly longRestHelpId = `rest-long-move-help-${this.uid}`;

  /**
   * These controls are `aria-disabled`, not `disabled`, so they keep their tab stop and their
   * focus when they turn themselves off mid-interaction -- filling the last slot would otherwise
   * disable the very button just pressed and drop focus to `<body>`, outside the dialog's trap.
   * The trade is that the click still fires, so the guard lives here.
   */
  protected onAdd(move: RestMoveDefinition): void {
    if (this.full()) return;
    this.moveAdded.emit(move);
  }

  protected onChangeSlots(delta: number): void {
    if (delta < 0 && !this.canRemoveSlot()) return;
    if (delta > 0 && !this.canAddSlot()) return;
    this.slotsChanged.emit(delta);
  }
}
