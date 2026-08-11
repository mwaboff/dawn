import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, tap } from 'rxjs';

import { AdversaryData } from '../../../../../adversary-card/adversary-card.model';
import { EncounterRunAdversaryResponse } from '../../../../../../models/encounter-run-api.model';
import { ResourceTracker } from '../../../../../resource-tracker/resource-tracker';
import { CardFeatureItem } from '../../../../../daggerheart-card/card-feature-item/card-feature-item';
import { titleCase } from '../../../../../../utils/text.utils';

const NOTE_MAX_LENGTH = 2000;
const NOTE_DEBOUNCE_MS = 500;

/**
 * The full stat block revealed under one adversary row on expand -- mirrors
 * `party-member-detail`'s role in the party list this pattern is borrowed from, with one
 * necessary difference: that component is read-only (a PC's own player marks their sheet
 * elsewhere), but an adversary has no such self-service -- the GM is the only one who ever marks
 * its HP/Stress, so the actual marking controls have to live somewhere, and this is that
 * somewhere.
 *
 * After several rounds of trimming the row above, this is now where *every* interactive control
 * for the adversary lives: HP/Stress `ResourceTracker` pips, the token +/- stepper, and the
 * Mark Defeated/Revive toggle. The row itself shows only read-only numbers plus a skull glyph and
 * a type/tier secondary line, which is what let it become a single disclosure button.
 *
 * Mark Defeated/Revive is a standalone control, independent of HP -- marking the last HP box also
 * sets `isDefeated` (see `EncounterRunView.onHpChange`) as a one-click convenience for the common
 * case (Core ch. 4: "When an adversary marks their last Hit Point, they are defeated... but you
 * and your players decide what this means"), but `isDefeated` is its own flag on the model, not
 * derived from HP, and a GM narrating a surrender, a retreat, or fiat-ing an early end to a fight
 * needs a way to mark that without first maxing out HP to get there. A prior round of trimming
 * removed this as a standalone control on the assumption the HP-tracker path covered every case;
 * it didn't (HP-marking is a one-way ratchet toward defeat and forces a specific narrative reason
 * for it), and this restores it.
 *
 * Owns its own note-editing state (draft/dirty/debounce) exactly as `RunAdversaryRow` used to --
 * moved here wholesale since the notes field moved here. Safe to do because this component is
 * mounted once per row and only `[hidden]`-toggled, never added/removed from the DOM by expand/
 * collapse, so `ngOnDestroy` only fires when the whole row goes away (route change, run reload),
 * which is exactly when a still-unsaved note needs to be flushed.
 */
@Component({
  selector: 'app-run-adversary-detail',
  templateUrl: './run-adversary-detail.html',
  styleUrls: ['../../../run-stat-row/run-detail-shell.css', './run-adversary-detail.css'],
  imports: [ResourceTracker, CardFeatureItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunAdversaryDetail implements OnDestroy {
  readonly adversary = input.required<EncounterRunAdversaryResponse>();
  readonly statBlock = input.required<AdversaryData>();
  readonly idPrefix = input.required<string>();
  readonly rowLabel = input.required<string>();
  readonly isRetiered = input.required<boolean>();

  readonly hpMarkedChange = output<number>();
  readonly stressMarkedChange = output<number>();
  readonly tokensChange = output<number>();
  readonly defeatedToggle = output<void>();
  readonly noteChange = output<string>();

  readonly noteMaxLength = NOTE_MAX_LENGTH;

  /** `Battleaxe · Very Close · 2d8+5 phy` -- the range enum is title-cased (`shared/utils/
   * text.utils.ts`), since the raw `VERY_CLOSE` is an implementation detail, not what the book
   * prints. `damage.notation` is the backend's already-formatted printed damage line and already
   * ends in the abbreviated type ("phy"/"mag") for every adversary -- appending `damageType` on
   * top duplicated it ("2d8+5 phy physical"). See `adversary-card.ts`'s `damageLabel` for the same
   * fix with the same reasoning. */
  readonly attackDetailLabel = computed(() => {
    const data = this.statBlock();
    if (!data.weaponName) return undefined;
    return [data.weaponName, titleCase(data.attackRange) || undefined, data.damage?.notation]
      .filter((part): part is string => !!part)
      .join(' · ');
  });

  private readonly noteDirty = signal(false);
  readonly noteDraft = signal('');
  private readonly noteInput$ = new Subject<string>();

  constructor() {
    effect(() => {
      const note = this.adversary().note ?? '';
      untracked(() => {
        if (!this.noteDirty()) this.noteDraft.set(note);
      });
    });

    this.noteInput$
      .pipe(
        debounceTime(NOTE_DEBOUNCE_MS),
        tap(value => {
          this.noteDirty.set(false);
          this.noteChange.emit(value);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  onNoteInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.noteDraft.set(value);
    this.noteDirty.set(true);
    this.noteInput$.next(value);
  }

  /** Same reasoning as the old `RunAdversaryRow.ngOnDestroy`: `ngOnDestroy` runs before Angular
   * tears down this component's outputs, so emitting here is guaranteed to still reach the
   * parent's listener. */
  ngOnDestroy(): void {
    if (this.noteDirty()) this.noteChange.emit(this.noteDraft());
  }

  onTokensIncrement(): void {
    this.tokensChange.emit(this.adversary().tokens + 1);
  }

  onTokensDecrement(): void {
    this.tokensChange.emit(Math.max(0, this.adversary().tokens - 1));
  }

  formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
}
