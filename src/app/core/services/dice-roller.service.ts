import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DiceRollerTheme,
  DICE_ROLLER_THEMES,
  DICE_SIDES,
  DieResult,
  DualityResult,
  RollRequest,
  RollResult,
} from '../../shared/models/dice-roller.model';

@Injectable({ providedIn: 'root' })
export class DiceRollerService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'oh-sheet:dice-roller-theme';

  readonly history = signal<RollResult[]>([]);
  readonly isOpen = signal(false);
  readonly theme = signal<DiceRollerTheme>(this.loadTheme());
  readonly pendingRequest = signal<RollRequest | null>(null);

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen.update(v => !v); }

  setTheme(theme: DiceRollerTheme): void {
    this.theme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  roll(request: RollRequest): RollResult {
    const diceResults: DieResult[] = [];
    for (const sel of request.dice) {
      const isNeg = sel.count < 0;
      for (let i = 0; i < Math.abs(sel.count); i++) {
        const raw = this.rollOne(DICE_SIDES[sel.type]);
        diceResults.push({ type: sel.type, value: isNeg ? -raw : raw });
      }
    }
    let duality: DualityResult | null = null;
    if (request.includeDuality) {
      const hope = this.rollOne(12);
      const fear = this.rollOne(12);
      duality = {
        hope,
        fear,
        outcome: hope === fear ? 'crit' : hope > fear ? 'hope' : 'fear',
      };
    }
    const total =
      diceResults.reduce((s, d) => s + d.value, 0) +
      (duality ? duality.hope + duality.fear : 0);

    const result: RollResult = {
      id: this.nextId(),
      timestamp: Date.now(),
      diceResults,
      duality,
      total,
      label: request.label,
    };
    this.history.update(h => [result, ...h]);
    return result;
  }

  clearHistory(): void { this.history.set([]); }

  externalTrigger(request: RollRequest): void {
    this.pendingRequest.set(request);
    this.open();
  }

  consumePendingRequest(): RollRequest | null {
    const r = this.pendingRequest();
    this.pendingRequest.set(null);
    return r;
  }

  private idCounter = 0;

  private nextId(): string {
    this.idCounter += 1;
    return `${Date.now()}-${this.idCounter}`;
  }

  private rollOne(sides: number): number {
    if (isPlatformBrowser(this.platformId) && typeof crypto !== 'undefined') {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return (buf[0] % sides) + 1;
    }
    return Math.floor(Math.random() * sides) + 1;
  }

  private loadTheme(): DiceRollerTheme {
    if (!isPlatformBrowser(this.platformId)) return 'tavern-scroll';
    const raw = localStorage.getItem(this.storageKey);
    return (DICE_ROLLER_THEMES as readonly string[]).includes(raw as string)
      ? (raw as DiceRollerTheme)
      : 'tavern-scroll';
  }
}
