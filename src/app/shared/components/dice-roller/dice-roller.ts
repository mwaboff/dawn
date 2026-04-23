import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DiceRollerService } from '../../../core/services/dice-roller.service';
import {
  DICE_SIDES,
  DICE_TYPES,
  DiceType,
  RollRequest,
  RollResult,
} from '../../models/dice-roller.model';

@Component({
  selector: 'app-dice-roller',
  templateUrl: './dice-roller.html',
  styleUrl: './dice-roller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceRoller implements OnInit, OnDestroy {
  readonly service = inject(DiceRollerService);

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

  readonly recent = computed<RollResult | null>(() => this.service.history()[0] ?? null);
  readonly isDualityChecked = computed(() => this.includeDuality());
  readonly canRoll = computed(() =>
    this.includeDuality() || this.diceTypes.some(t => this.counts()[t] !== 0)
  );

  ngOnInit(): void {
    const pending = this.service.consumePendingRequest();
    if (pending) {
      const newCounts: Record<DiceType, number> = {
        d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0,
      };
      for (const sel of pending.dice) {
        newCounts[sel.type] = sel.count;
      }
      this.counts.set(newCounts);
      this.includeDuality.set(pending.includeDuality);
    }
  }

  getCount(type: DiceType): number {
    return this.counts()[type];
  }

  adjustCount(type: DiceType, delta: number): void {
    this.counts.update(c => ({ ...c, [type]: c[type] + delta }));
  }

  toggleDuality(checked: boolean): void {
    this.includeDuality.set(checked);
  }

  resetCounts(): void {
    this.counts.set({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 });
    this.includeDuality.set(false);
  }

  onRoll(): void {
    const dice = this.diceTypes
      .map(type => ({ type, count: this.counts()[type] }))
      .filter(sel => sel.count !== 0);

    const request: RollRequest = {
      dice,
      includeDuality: this.includeDuality(),
    };
    this.service.roll(request);

    const includeDuality = this.includeDuality();
    const minRoll = dice.reduce((sum, sel) => {
      const faces = DICE_SIDES[sel.type];
      return sel.count > 0 ? sum + sel.count : sum - Math.abs(sel.count) * faces;
    }, 0) + (includeDuality ? 2 : 0);
    const maxRoll = dice.reduce((sum, sel) => {
      const faces = DICE_SIDES[sel.type];
      return sel.count > 0 ? sum + sel.count * faces : sum - Math.abs(sel.count);
    }, 0) + (includeDuality ? 24 : 0);
    const range = maxRoll - minRoll;
    const randomInRange = () => Math.floor(Math.random() * (range + 1)) + minRoll;

    if (this.rollingInterval) clearInterval(this.rollingInterval);
    if (this.rollingTimeout) clearTimeout(this.rollingTimeout);
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
  }

  outcomeLabel(result: RollResult): string {
    if (!result.duality) return '';
    if (result.duality.outcome === 'crit') return 'Critical Success!';
    if (result.duality.outcome === 'hope') return 'with Hope';
    return 'with Fear';
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
