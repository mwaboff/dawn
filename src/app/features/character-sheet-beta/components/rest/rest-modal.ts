import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DiceRollerService } from '../../../../core/services/dice-roller.service';
import { DiceType } from '../../../../shared/models/dice-roller.model';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import {
  BASE_REST_MOVES,
  MAX_REST_MOVES,
  RestApplyResult,
  RestCharacterState,
  RestMoveAccess,
  RestMoveDefinition,
  RestOutcome,
  RestSelection,
  RestType,
} from './models/rest.model';
import { movesForRest } from './utils/rest-catalog';
import { applyRestMoves, RestDiceRoller } from './utils/rest.utils';
import {
  addSelection,
  pruneIllegalSelections,
  removeSelection,
  setSelectionTarget,
  setSelectionWithParty,
  trimSelections,
} from './utils/rest-selection.utils';
import { RestTypeStep } from './components/rest-type-step/rest-type-step';
import { RestMovesStep, RestPartyChange, RestTargetChange } from './components/rest-moves-step/rest-moves-step';
import { RestSummaryStep } from './components/rest-summary-step/rest-summary-step';

export type RestStep = 'type' | 'moves' | 'summary';

const STEP_ANNOUNCEMENTS: Readonly<Record<RestStep, string>> = {
  type: 'Step 1 of 3: choose short rest or long rest.',
  moves: 'Step 2 of 3: choose your downtime moves.',
  summary: 'Step 3 of 3: your rest is saved.',
};

/**
 * The rest flow. The step is DERIVED from what has been chosen and what the host has confirmed --
 * there is no step signal to keep in sync, and the summary is unreachable until a save succeeds.
 */
@Component({
  selector: 'app-rest-modal',
  imports: [ModalShell, RestTypeStep, RestMovesStep, RestSummaryStep],
  templateUrl: './rest-modal.html',
  styleUrl: './rest-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestModal {
  private readonly dice = inject(DiceRollerService);

  readonly state = input.required<RestCharacterState>();
  readonly access = input.required<RestMoveAccess>();
  /** True while the host's PUT is in flight. Blocks dismissal and a second submit. */
  readonly processing = input(false);
  readonly applyResult = input<RestApplyResult | null>(null);

  readonly submitted = output<RestOutcome>();
  readonly dismissed = output<void>();

  private readonly restType = signal<RestType | null>(null);
  private readonly extraSlots = signal(0);
  private readonly outcome = signal<RestOutcome | null>(null);

  readonly useLongRestMove = signal(false);
  readonly selections = signal<readonly RestSelection[]>([]);

  protected readonly slots = computed(() => BASE_REST_MOVES + this.extraSlots());
  protected readonly chosenType = computed(() => this.restType());
  protected readonly savedOutcome = computed(() => this.outcome());

  protected readonly step = computed<RestStep>(() => {
    if (this.applyResult()?.status === 'saved' && this.outcome() !== null) return 'summary';
    return this.restType() === null ? 'type' : 'moves';
  });

  protected readonly saveFailed = computed(() => this.applyResult()?.status === 'error');

  protected readonly availableMoves = computed(() => {
    const type = this.restType();
    return type === null ? [] : movesForRest(type, this.access(), this.useLongRestMove());
  });

  protected readonly dialogTitle = computed(() => {
    switch (this.step()) {
      case 'type':
        return 'Take a rest';
      case 'summary':
        return 'Rested';
      default:
        return this.restType() === 'short' ? 'Short rest' : 'Long rest';
    }
  });

  protected readonly stepAnnouncement = computed(() => STEP_ANNOUNCEMENTS[this.step()]);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    // Each step swaps the whole body out, so focus has to follow or it falls back to the document.
    // `ModalShell` owns the trap and the initial focus; this only moves focus onto the heading of
    // whichever step just rendered. Deferred to `afterNextRender` because the effect runs before
    // the new step's DOM exists -- the same pattern `inventory-section-beta` uses.
    effect(() => {
      this.step();
      untracked(() =>
        afterNextRender(
          () => this.host.nativeElement.querySelector<HTMLElement>('.rest-step__heading')?.focus(),
          { injector: this.injector },
        ),
      );
    });
  }

  protected chooseType(type: RestType): void {
    this.restType.set(type);
  }

  /** Back to step one. The rest is not half-chosen -- it starts over. */
  protected back(): void {
    this.restType.set(null);
    this.selections.set([]);
    this.useLongRestMove.set(false);
    this.extraSlots.set(0);
  }

  protected addMove(move: RestMoveDefinition): void {
    if (this.selections().length >= this.slots()) return;
    this.selections.update(list => addSelection(list, move));
  }

  protected removeMove(key: string): void {
    this.selections.update(list => removeSelection(list, key));
  }

  protected setTarget(change: RestTargetChange): void {
    this.selections.update(list => setSelectionTarget(list, change.key, change.target));
  }

  protected setWithParty(change: RestPartyChange): void {
    this.selections.update(list => setSelectionWithParty(list, change.key, change.withParty));
  }

  protected changeSlots(delta: number): void {
    const next = Math.min(MAX_REST_MOVES, Math.max(BASE_REST_MOVES, this.slots() + delta));
    this.extraSlots.set(next - BASE_REST_MOVES);
    this.selections.update(list => trimSelections(list, next));
  }

  /** Dropping the substitution must not strand a long-rest move inside a short rest. */
  protected toggleLongRestMove(enabled: boolean): void {
    this.useLongRestMove.set(enabled);
    this.selections.update(list => pruneIllegalSelections(list, this.availableMoves()));
  }

  protected submit(): void {
    const type = this.restType();
    if (type === null || this.processing()) return;
    const outcome = applyRestMoves(type, this.state(), this.selections(), this.rollDice);
    this.outcome.set(outcome);
    this.submitted.emit(outcome);
  }

  /**
   * Headless: this computes and records a roll without opening the on-screen tray. The labelled
   * results still land in the roller's history, so a player who opens the tray afterwards finds
   * the rest's dice where every other roll on this page appears.
   */
  private readonly rollDice: RestDiceRoller = (sides, count) =>
    this.dice
      .roll({ dice: [{ type: `d${sides}` as DiceType, count }], includeDuality: false, label: 'Downtime' })
      .diceResults.map(die => die.value);
}
