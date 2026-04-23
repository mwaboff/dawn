import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { DiceRollerService } from '../../../core/services/dice-roller.service';
import {
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
export class DiceRoller implements OnInit {
  readonly service = inject(DiceRollerService);

  readonly diceTypes: readonly DiceType[] = DICE_TYPES;

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
