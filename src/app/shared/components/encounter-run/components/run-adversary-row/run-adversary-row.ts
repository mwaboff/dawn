import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, tap } from 'rxjs';

import { AdversaryCard } from '../../../adversary-card/adversary-card';
import { ResourceTracker } from '../../../resource-tracker/resource-tracker';
import { EncounterRunAdversaryResponse } from '../../../../models/encounter-run-api.model';
import { mapAdversaryToAdversaryData } from '../../../../mappers/adversary.mapper';

const NOTE_MAX_LENGTH = 2000;
const NOTE_DEBOUNCE_MS = 500;

/**
 * One instance's stat block + live combat counters: the unit a GM reads and clicks on during a
 * fight. Wraps `AdversaryCard` rather than forking it -- HP/Stress/Tokens are the row's own
 * concern, everything else (Difficulty, Thresholds, Features, Experiences) is the card's.
 *
 * Purely a view over the `EncounterRunAdversaryResponse` the parent already holds -- every
 * mutation is emitted upward as the new absolute value. The parent owns the optimistic
 * update/PATCH/rollback; this component never talks to the network.
 */
@Component({
  selector: 'app-run-adversary-row',
  templateUrl: './run-adversary-row.html',
  styleUrl: './run-adversary-row.css',
  imports: [AdversaryCard, ResourceTracker],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunAdversaryRow implements OnDestroy {
  readonly adversary = input.required<EncounterRunAdversaryResponse>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');

  readonly hpMarkedChange = output<number>();
  readonly stressMarkedChange = output<number>();
  readonly tokensChange = output<number>();
  readonly defeatedToggle = output<void>();
  readonly noteChange = output<string>();

  readonly noteMaxLength = NOTE_MAX_LENGTH;

  /** Keyed on the run instance's own id, never the catalog adversaryId -- a run can hold three
   * Giant Mosquitoes sharing one catalog id, and they must not collide on ResourceTracker's
   * generated box ids. */
  readonly idPrefix = computed(() => `run-adversary-${this.adversary().id}`);

  readonly rowLabel = computed(() => this.adversary().label ?? this.adversary().adversary?.name ?? 'Adversary');

  readonly adversaryData = computed(() => {
    const statBlock = this.adversary().adversary;
    return statBlock ? mapAdversaryToAdversaryData(statBlock) : undefined;
  });

  private readonly noteDirty = signal(false);
  readonly noteDraft = signal('');
  private readonly noteInput$ = new Subject<string>();

  constructor() {
    // Skips re-syncing while the GM is actively typing (or waiting on the debounced save) so an
    // unrelated field update on this same row -- marking HP mid-note -- can't clobber the draft.
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

  /**
   * A GM who types a note and immediately navigates away shouldn't lose up to
   * NOTE_DEBOUNCE_MS of typing to the debounce timer never getting to fire. `ngOnDestroy` runs
   * before Angular tears down this component's outputs (that happens during the DestroyRef
   * cleanup phase, right after), so emitting here -- rather than from a `DestroyRef.onDestroy`
   * callback racing that same teardown -- is guaranteed to still reach the parent's listener.
   */
  ngOnDestroy(): void {
    if (this.noteDirty()) this.noteChange.emit(this.noteDraft());
  }

  onTokensIncrement(): void {
    this.tokensChange.emit(this.adversary().tokens + 1);
  }

  onTokensDecrement(): void {
    this.tokensChange.emit(Math.max(0, this.adversary().tokens - 1));
  }
}
