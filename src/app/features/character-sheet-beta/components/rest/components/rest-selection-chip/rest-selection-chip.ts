import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RestMoveDefinition, RestMoveTarget, RestSelection } from '../../models/rest.model';

/** One option of the chip's segmented control. Both variants are the same two-button shape. */
interface ChipChoice {
  readonly label: string;
  readonly active: boolean;
  readonly value: boolean;
}

/**
 * One filled downtime slot: the move's name, the toggle for however it varies (aim it at an ally,
 * or prepare with the party), and a way to take it back.
 */
@Component({
  selector: 'app-rest-selection-chip',
  templateUrl: './rest-selection-chip.html',
  styleUrl: './rest-selection-chip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestSelectionChip {
  readonly selection = input.required<RestSelection>();
  readonly definition = input.required<RestMoveDefinition>();

  readonly targetChanged = output<RestMoveTarget>();
  readonly withPartyChanged = output<boolean>();
  readonly removed = output<void>();

  /**
   * Ally targeting and the Prepare party option are the same control with different words, so
   * they share one template block. `value` is what the chip emits when that side is picked.
   */
  protected readonly choices = computed<readonly ChipChoice[]>(() => {
    const selection = this.selection();
    if (this.definition().targetable) {
      return [
        { label: 'Myself', active: selection.target === 'self', value: false },
        { label: 'An ally', active: selection.target === 'ally', value: true },
      ];
    }
    if (this.definition().partyOption) {
      return [
        { label: 'Alone', active: !selection.withParty, value: false },
        { label: 'With the party', active: selection.withParty, value: true },
      ];
    }
    return [];
  });

  protected onChoose(value: boolean): void {
    if (this.definition().targetable) {
      this.targetChanged.emit(value ? 'ally' : 'self');
      return;
    }
    this.withPartyChanged.emit(value);
  }
}
