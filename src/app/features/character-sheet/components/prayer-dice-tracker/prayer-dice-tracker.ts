import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { PrayerDie } from '../../../create-character/models/character-sheet-api.model';
import { readyPrayerDiceCount } from '../../utils/prayer-dice.utils';

/** What the last roll did, so the panel can explain a Devout roll. Null before any roll this visit. */
export interface PrayerDiceRollSummary {
  /** How many dice were rolled, including the one Devout discarded. */
  readonly rolledCount: number;
  /** The face Devout discarded, or null when Devout was not applied. */
  readonly dropped: number | null;
}

/**
 * The Seraph's Prayer Dice: d4s rolled at the start of a session, spent one at a time for their
 * face value, and cleared by the next session's roll.
 *
 * Purely presentational -- rolling, persistence and the Devout rule all live in the host sheet, so
 * the classic and beta sheets share one tracker.
 *
 * The dice render as triangles rather than the square pips every other tracker on the sheet uses,
 * because a d4 reads as a triangle in the hand and it keeps Prayer Dice identifiable at a glance
 * beside the Hope, Stress, Armor and Focus tracks.
 */
@Component({
  selector: 'app-prayer-dice-tracker',
  templateUrl: './prayer-dice-tracker.html',
  styleUrl: './prayer-dice-tracker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe],
})
export class PrayerDiceTracker {
  readonly dice = input.required<readonly PrayerDie[]>();
  /** The Spellcast trait's backend enum name (e.g. `STRENGTH`), or null when the subclass has none. */
  readonly traitName = input<string | null>(null);
  /** The Spellcast trait's modified value, which is how many dice a roll produces. */
  readonly traitValue = input<number>(0);
  /** Renders the controls as non-interactive for a viewer who does not own the sheet. */
  readonly readonly = input(false);
  /** Whether the character has the Divine Wielder "Devout" feature, which shows its toggle. */
  readonly showDevout = input(false);
  readonly useDevout = input(true);
  /** Set after a roll so the panel can report what Devout discarded. */
  readonly lastRoll = input<PrayerDiceRollSummary | null>(null);

  readonly dieToggled = output<number>();
  readonly rollRequested = output<void>();
  readonly useDevoutChange = output<boolean>();

  readonly readyCount = computed(() => readyPrayerDiceCount(this.dice()));
  /** How many dice the next roll will place, which is the Spellcast trait floored at zero. */
  readonly diceOnRoll = computed(() => Math.max(this.traitValue(), 0));
  readonly hasDice = computed(() => this.dice().length > 0);
  /** True when the character's Spellcast trait is too low to produce any dice at all. */
  readonly traitTooLow = computed(() => this.diceOnRoll() === 0);
  /** False when the subclass grants no Spellcast trait, which needs different wording. */
  readonly hasSpellcastTrait = computed(() => this.traitName() !== null);
  readonly traitLabel = computed(() => this.traitName() ?? '');
  readonly formattedTrait = computed(() =>
    this.traitValue() >= 0 ? `+${this.traitValue()}` : `${this.traitValue()}`,
  );
  /** Hidden when there is nothing to roll, rather than left as a dead disabled control. */
  readonly canRoll = computed(() => !this.readonly() && !this.traitTooLow());

  /** The button's visible caption: there is nothing to re-roll until dice are on the sheet. */
  readonly rollVerb = computed(() => (this.hasDice() ? 'Reroll' : 'Roll'));

  /**
   * Rolling replaces the whole set, so any dice still on the sheet are lost. The label says so
   * outright rather than putting a confirmation dialog in front of a once-a-session button.
   *
   * Opens with `rollVerb()` so the accessible name contains the visible caption verbatim, as
   * WCAG SC 2.5.3 (Label in Name) requires for speech-input users.
   */
  readonly rollLabel = computed(() => {
    const count = this.dice().length;
    return count === 0
      ? `${this.rollVerb()} Prayer Dice for a new session`
      : `${this.rollVerb()} Prayer Dice for a new session, discarding the ${count} on your sheet`;
  });

  /**
   * The visible tally. It also carries the stake of rerolling, because the roll control is a glyph
   * whose `title` never reaches a touch or keyboard user.
   */
  readonly statusLine = computed(() => {
    if (!this.hasDice()) return '';
    const tally = `${this.readyCount()} of ${this.dice().length} ready`;
    return this.readyCount() > 0 && !this.readonly()
      ? `${tally} — rolling again discards them`
      : tally;
  });

  /** Visible explanation of a Devout roll; null when Devout did not drop a die. */
  readonly devoutNote = computed(() => {
    const roll = this.lastRoll();
    if (!roll || roll.dropped === null) return null;
    return `Devout: rolled ${roll.rolledCount} dice, dropped the lowest (${roll.dropped}).`;
  });

  /**
   * Spoken-only detail of the roll. A sighted player reads four face values in one glance; without
   * this a screen reader user would get only a count and have to walk the dice one button at a
   * time to learn what they rolled.
   */
  readonly rollAnnouncement = computed(() => {
    if (!this.lastRoll() || !this.hasDice()) return '';
    const values = this.dice().map(die => die.value).join(', ');
    return `Rolled ${this.dice().length} Prayer Dice: ${values}.`;
  });

  /**
   * Deliberately stable across a spend: the die's state is carried by `aria-pressed` alone, matching
   * `ResourceTracker`. Putting "spent" in the name too would announce the state twice, in two
   * vocabularies.
   */
  dieAriaLabel(die: PrayerDie, index: number): string {
    return `Prayer Die ${index + 1}, value ${die.value}`;
  }

  onDieClick(index: number): void {
    if (this.readonly()) return;
    this.dieToggled.emit(index);
  }

  onRoll(): void {
    if (!this.canRoll()) return;
    this.rollRequested.emit();
  }

  onDevoutToggle(event: Event): void {
    this.useDevoutChange.emit((event.target as HTMLInputElement).checked);
  }
}
