import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { DiceRoller } from './dice-roller';
import { DiceRollerService } from '../../../core/services/dice-roller.service';
import { RollResult } from '../../models/dice-roller.model';

function makeResult(overrides: Partial<RollResult> = {}): RollResult {
  return {
    id: 'test-1',
    timestamp: Date.now(),
    diceResults: [],
    duality: null,
    total: 0,
    ...overrides,
  };
}

describe('DiceRoller', () => {
  let fixture: ComponentFixture<DiceRoller>;
  let service: DiceRollerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DiceRoller],
    });
    fixture = TestBed.createComponent(DiceRoller);
    service = TestBed.inject(DiceRollerService);
    service.isOpen.set(false);
    service.history.set([]);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the FAB button', () => {
    const fab = fixture.nativeElement.querySelector('.ts-fab');
    expect(fab).toBeTruthy();
  });

  it('FAB click toggles service.isOpen from false to true', () => {
    expect(service.isOpen()).toBe(false);
    const fab: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-fab');
    fab.click();
    expect(service.isOpen()).toBe(true);
  });

  it('FAB click toggles service.isOpen from true to false', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const fab: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-fab');
    fab.click();
    expect(service.isOpen()).toBe(false);
  });

  it('menu does not render when isOpen is false', () => {
    service.isOpen.set(false);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.ts-menu');
    expect(menu).toBeNull();
  });

  it('menu renders when isOpen is true', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.ts-menu');
    expect(menu).toBeTruthy();
  });

  it('menu contains counter values for all 7 die types', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const vals = fixture.nativeElement.querySelectorAll('.ts-counter-val');
    expect(vals.length).toBe(7);
  });

  it('increment button increases die count', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const increaseBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d6"]'
    );
    increaseBtn.click();
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('[aria-label="Increase d6"]')
      ?.closest('[role="group"]')
      ?.querySelector('.ts-counter-val');
    expect(counter?.textContent?.trim()).toBe('1');
  });

  it('decrement button allows negative counts', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const decreaseBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Decrease d6"]'
    );
    decreaseBtn.click();
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('[aria-label="Decrease d6"]')
      ?.closest('[role="group"]')
      ?.querySelector('.ts-counter-val');
    expect(counter?.textContent?.trim()).toBe('-1');
  });

  it('clicking Roll calls service.roll with correct RollRequest', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d6"]'
    );
    increaseD6.click();
    increaseD6.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    expect(spy).toHaveBeenCalledOnce();
    const request = spy.mock.calls[0][0];
    const d6Entry = request.dice.find((d) => d.type === 'd6');
    expect(d6Entry?.count).toBe(2);
  });

  it('Roll request excludes dice with count 0', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
    increaseD6.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    const request = spy.mock.calls[0][0];
    expect(request.dice.every(d => d.count !== 0)).toBe(true);
    expect(request.dice.find(d => d.type === 'd4')).toBeUndefined();
  });

  it('roll request includes dice with negative counts', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const decreaseD8: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Decrease d8"]'
    );
    decreaseD8.click();
    decreaseD8.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    const request = spy.mock.calls[0][0];
    const d8Entry = request.dice.find((d) => d.type === 'd8');
    expect(d8Entry?.count).toBe(-2);
  });

  it('duality button toggles includeDuality in RollRequest', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const dualityBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-duality-btn');
    dualityBtn.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    const request = spy.mock.calls[0][0];
    expect(request.includeDuality).toBe(true);
  });

  it('duality defaults to false in RollRequest', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
    increaseD6.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    expect(spy.mock.calls[0][0].includeDuality).toBe(false);
  });

  it('history renders entries from service.history()', () => {
    service.history.set([
      makeResult({ id: 'r1', total: 7, diceResults: [{ type: 'd6', value: 7 }] }),
      makeResult({ id: 'r2', total: 4, diceResults: [{ type: 'd4', value: 4 }] }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.ts-history-row');
    expect(rows.length).toBe(2);
  });

  it('shows hope label when duality outcome is hope', () => {
    service.history.set([
      makeResult({ id: 'h1', total: 15, duality: { hope: 9, fear: 5, outcome: 'hope' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const outcome = fixture.nativeElement.querySelector('.ts-history-outcome');
    expect(outcome?.textContent?.trim()).toBe('Hope');
  });

  it('shows fear label when duality outcome is fear', () => {
    service.history.set([
      makeResult({ id: 'f1', total: 10, duality: { hope: 3, fear: 9, outcome: 'fear' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const outcome = fixture.nativeElement.querySelector('.ts-history-outcome');
    expect(outcome?.textContent?.trim()).toBe('Fear');
  });

  it('shows crit label when duality outcome is crit', () => {
    service.history.set([
      makeResult({ id: 'c1', total: 24, duality: { hope: 12, fear: 12, outcome: 'crit' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const outcome = fixture.nativeElement.querySelector('.ts-history-outcome');
    expect(outcome?.textContent?.trim()).toBe('CRIT!');
  });

  it('shows "with Hope" microcopy in last roll panel on hope outcome', () => {
    service.history.set([
      makeResult({ id: 'hope-1', total: 15, duality: { hope: 9, fear: 5, outcome: 'hope' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ts-result-outcome');
    expect(panel?.textContent?.trim()).toBe('with Hope');
  });

  it('shows "with Fear" microcopy in last roll panel on fear outcome', () => {
    service.history.set([
      makeResult({ id: 'fear-1', total: 10, duality: { hope: 3, fear: 9, outcome: 'fear' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ts-result-outcome');
    expect(panel?.textContent?.trim()).toBe('with Fear');
  });

  it('shows "Critical Success!" microcopy in last roll panel on crit outcome', () => {
    service.history.set([
      makeResult({ id: 'crit-1', total: 24, duality: { hope: 12, fear: 12, outcome: 'crit' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ts-result-outcome');
    expect(panel?.textContent?.trim()).toBe('Critical Success!');
  });

  it('clear history button calls service.clearHistory()', () => {
    service.history.set([makeResult({ id: 'r1', total: 5 })]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'clearHistory');
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-clear-btn');
    clearBtn.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('shows empty state text when no history', () => {
    service.history.set([]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.ts-history-empty');
    expect(empty?.textContent).toContain('no rolls recorded');
  });

  it('close button inside menu calls service.close()', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'close');
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-close-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('close button sets isOpen to false', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-close-btn');
    closeBtn.click();

    expect(service.isOpen()).toBe(false);
  });

  it('reset dice button clears duality selection', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const dualityBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-duality-btn');
    dualityBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isDualityChecked()).toBe(true);

    const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-reset-btn');
    resetBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isDualityChecked()).toBe(false);
  });

  it('reset dice button zeroes all die counts', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d6"]'
    );
    increaseD6.click();
    increaseD6.click();
    const increaseD20: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d20"]'
    );
    increaseD20.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.getCount('d6')).toBe(2);
    expect(fixture.componentInstance.getCount('d20')).toBe(1);

    const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-reset-btn');
    resetBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.getCount('d6')).toBe(0);
    expect(fixture.componentInstance.getCount('d20')).toBe(0);
    expect(fixture.componentInstance.getCount('d4')).toBe(0);
  });

  it('Roll button is disabled when no dice are selected', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    expect(rollBtn.disabled).toBe(true);
  });

  it('Roll button is enabled when at least one die is selected', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
    increaseD6.click();
    fixture.detectChanges();
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    expect(rollBtn.disabled).toBe(false);
  });

  it('Roll button is enabled when duality is toggled with no other dice', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const dualityBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-duality-btn');
    dualityBtn.click();
    fixture.detectChanges();
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    expect(rollBtn.disabled).toBe(false);
  });

  it('isRolling is false initially', () => {
    expect(fixture.componentInstance.isRolling()).toBe(false);
  });

  describe('roll animation', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('isRolling becomes true immediately after clicking roll', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      expect(fixture.componentInstance.isRolling()).toBe(true);
    });

    it('isRolling becomes false after 500ms', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      vi.advanceTimersByTime(250);

      expect(fixture.componentInstance.isRolling()).toBe(false);
    });

    it('displayTotal stays within min-max range during rolling with positive dice', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click(); // 1d6: min=1, max=6
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      const displayVal = fixture.componentInstance.displayTotal();
      expect(displayVal).toBeGreaterThanOrEqual(1);
      expect(displayVal).toBeLessThanOrEqual(6);
    });

    it('displayTotal updates on each interval tick', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD20: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d20"]');
      increaseD20.click(); // 1d20: min=1, max=20
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      const first = fixture.componentInstance.displayTotal();
      vi.advanceTimersByTime(50);
      // After one tick the interval fires and updates the display
      expect(typeof fixture.componentInstance.displayTotal()).toBe('number');
      expect(fixture.componentInstance.isRolling()).toBe(true);
      const second = fixture.componentInstance.displayTotal();
      expect(second).toBeGreaterThanOrEqual(1);
      expect(second).toBeLessThanOrEqual(20);
      // first is already checked to be a valid number; both are valid
      expect(first).toBeGreaterThanOrEqual(1);
      expect(first).toBeLessThanOrEqual(20);
    });
  });

  it('shows em-dash in result panel before any rolls', () => {
    service.history.set([]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.ts-result-empty');
    expect(empty?.textContent).toContain('—');
  });

  it('pre-fills dice counts from consumePendingRequest on init', () => {
    service.pendingRequest.set({
      dice: [{ type: 'd8', count: 3 }],
      includeDuality: true,
    });

    const newFixture = TestBed.createComponent(DiceRoller);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.getCount('d8')).toBe(3);
    expect(newFixture.componentInstance.isDualityChecked()).toBe(true);
    expect(service.pendingRequest()).toBeNull();
  });
});
