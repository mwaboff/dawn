import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  PLATFORM_ID,
  inject,
  signal,
  computed,
  effect,
  untracked,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DiceRollerService } from '../../../core/services/dice-roller.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import {
  AdvantageState,
  DICE_SIDES,
  DICE_TYPES,
  DiceType,
  RollModifier,
  RollRequest,
  RollResult,
} from '../../models/dice-roller.model';

@Component({
  selector: 'app-dice-roller',
  templateUrl: './dice-roller.html',
  styleUrl: './dice-roller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DiceRoller implements OnDestroy {
  readonly service = inject(DiceRollerService);
  private readonly preferences = inject(PreferencesService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly fabRef = viewChild<ElementRef<HTMLButtonElement>>('fab');

  readonly diceTypes: readonly DiceType[] = DICE_TYPES;

  private readonly _isRolling = signal(false);
  private readonly _displayTotal = signal<number>(0);
  readonly isRolling = computed(() => this._isRolling());
  readonly displayTotal = computed(() => this._displayTotal());
  private rollingInterval: ReturnType<typeof setInterval> | null = null;
  private rollingTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly counts = signal<Record<DiceType, number>>({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  });

  private readonly includeDuality = signal(false);

  // A pre-filled request's modifiers/advantage/label ride along on these signals until
  // onRoll() folds them back into the RollRequest it sends to the service. Any manual
  // edit to dice/duality (adjustCount, toggleDuality, resetCounts) clears them, since at
  // that point the roll is the user's own rather than the pre-filled one.
  private readonly pendingModifiers = signal<RollModifier[]>([]);
  private readonly pendingAdvantage = signal<AdvantageState | null>(null);
  private readonly pendingLabel = signal<string | undefined>(undefined);

  readonly recent = computed<RollResult | null>(() => this.service.history()[0] ?? null);
  readonly isDualityChecked = computed(() => this.includeDuality());
  readonly canRoll = computed(() =>
    this.includeDuality() || this.diceTypes.some(t => this.counts()[t] !== 0)
  );

  constructor() {
    // pendingRequest is read/write coupled: applyPendingRequest doesn't touch it, but
    // consumePendingRequest() (called first) sets it to null, which re-runs this effect
    // and hits the early return. Terminates in exactly two passes, never a loop.
    effect(() => {
      const pending = this.service.pendingRequest();
      if (!pending) return;
      // untracked: applyPendingRequest/onRoll read several component signals (counts,
      // canRoll, ...) that must not become dependencies of this effect — it should only
      // ever re-run because pendingRequest changed.
      untracked(() => {
        this.service.consumePendingRequest();
        this.applyPendingRequest(pending);
        if (pending.autoRoll) this.onRoll();
      });
    });
  }

  private applyPendingRequest(pending: RollRequest): void {
    const newCounts: Record<DiceType, number> = {
      d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0,
    };
    for (const sel of pending.dice) {
      newCounts[sel.type] = sel.count;
    }
    this.counts.set(newCounts);
    this.includeDuality.set(pending.includeDuality);
    this.pendingModifiers.set(pending.modifiers ?? []);
    this.pendingAdvantage.set(pending.advantage ?? null);
    this.pendingLabel.set(pending.label);
  }

  getCount(type: DiceType): number {
    return this.counts()[type];
  }

  adjustCount(type: DiceType, delta: number): void {
    this.counts.update(c => ({ ...c, [type]: c[type] + delta }));
    this.clearPendingExtras();
  }

  toggleDuality(checked: boolean): void {
    this.includeDuality.set(checked);
    this.clearPendingExtras();
  }

  resetCounts(): void {
    this.counts.set({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 });
    this.includeDuality.set(false);
    this.clearPendingExtras();
  }

  private clearPendingExtras(): void {
    this.pendingModifiers.set([]);
    this.pendingAdvantage.set(null);
    this.pendingLabel.set(undefined);
  }

  onRoll(): void {
    if (!this.canRoll()) return;

    const dice = this.diceTypes
      .map(type => ({ type, count: this.counts()[type] }))
      .filter(sel => sel.count !== 0);
    const modifiers = this.pendingModifiers();
    const advantage = this.pendingAdvantage();

    const request: RollRequest = {
      dice,
      includeDuality: this.includeDuality(),
      modifiers,
      advantage: advantage ?? undefined,
      label: this.pendingLabel(),
    };
    this.service.roll(request);

    if (this.rollingInterval) clearInterval(this.rollingInterval);
    if (this.rollingTimeout) clearTimeout(this.rollingTimeout);

    if (this.preferences.effectiveMotion() === 'reduced') {
      // No spinning readout: land directly on the settled total service.roll() already
      // computed. The result panel and history already render the real value whenever
      // isRolling() is false, so simply never entering the rolling state is sufficient.
      this.rollingInterval = null;
      this.rollingTimeout = null;
      this._isRolling.set(false);
      return;
    }

    const includeDuality = this.includeDuality();
    const modifierTotal = modifiers.reduce((sum, mod) => sum + mod.value, 0);
    let minRoll = dice.reduce((sum, sel) => {
      const faces = DICE_SIDES[sel.type];
      return sel.count > 0 ? sum + sel.count : sum - Math.abs(sel.count) * faces;
    }, 0) + (includeDuality ? 2 : 0) + modifierTotal;
    let maxRoll = dice.reduce((sum, sel) => {
      const faces = DICE_SIDES[sel.type];
      return sel.count > 0 ? sum + sel.count * faces : sum - Math.abs(sel.count);
    }, 0) + (includeDuality ? 24 : 0) + modifierTotal;
    if (advantage === 'advantage') {
      minRoll += 1;
      maxRoll += 6;
    } else if (advantage === 'disadvantage') {
      minRoll -= 6;
      maxRoll -= 1;
    }
    const range = maxRoll - minRoll;
    const randomInRange = () => Math.floor(Math.random() * (range + 1)) + minRoll;

    this._isRolling.set(true);
    this._displayTotal.set(randomInRange());

    this.rollingInterval = setInterval(() => {
      this._displayTotal.set(randomInRange());
    }, 50);

    this.rollingTimeout = setTimeout(() => {
      clearInterval(this.rollingInterval!);
      this.rollingInterval = null;
      this.rollingTimeout = null;
      this._isRolling.set(false);
    }, 250);
  }

  ngOnDestroy(): void {
    if (this.rollingInterval) clearInterval(this.rollingInterval);
    if (this.rollingTimeout) clearTimeout(this.rollingTimeout);
    // Guard against a triggered-but-never-mounted-again roll leaking into the next
    // instance: if this component is destroyed before the constructor effect consumed
    // its pre-fill, drop it rather than auto-rolling unexpectedly on next mount.
    this.service.consumePendingRequest();
  }

  onCloseClick(): void {
    this.service.close();
    this.focusFab();
  }

  onEscape(): void {
    if (!this.service.isOpen()) return;
    this.service.close();
    this.focusFab();
  }

  private focusFab(): void {
    if (!this.isBrowser) return;
    this.fabRef()?.nativeElement.focus();
  }

  outcomeLabel(result: RollResult): string {
    if (!result.duality) return '';
    if (result.duality.outcome === 'crit') return 'Critical Success!';
    if (result.duality.outcome === 'hope') return 'with Hope';
    return 'with Fear';
  }

  formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  historyDiceStr(result: RollResult): string {
    const parts: string[] = [];
    if (result.diceResults.length > 0) {
      parts.push(result.diceResults.map(d => `${d.type}:${d.value}`).join(', '));
    }
    if (result.duality) {
      parts.push(`\u2726${result.duality.hope}/\u2726${result.duality.fear}`);
    }
    return parts.join(' + ');
  }
}
