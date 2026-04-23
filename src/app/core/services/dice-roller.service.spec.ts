import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DiceRollerService } from './dice-roller.service';
import { DICE_ROLLER_THEMES } from '../../shared/models/dice-roller.model';

describe('DiceRollerService', () => {
  let service: DiceRollerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiceRollerService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('roll()', () => {
    it('rolls a single d6 and returns a value in range 1..6', () => {
      const result = service.roll({ dice: [{ type: 'd6', count: 1 }], includeDuality: false });

      expect(result.diceResults).toHaveLength(1);
      expect(result.diceResults[0].value).toBeGreaterThanOrEqual(1);
      expect(result.diceResults[0].value).toBeLessThanOrEqual(6);
    });

    it('rolls 2d6 and returns two dice results', () => {
      const result = service.roll({ dice: [{ type: 'd6', count: 2 }], includeDuality: false });

      expect(result.diceResults).toHaveLength(2);
    });

    it('rolls 2d6 and total matches sum of dice', () => {
      const result = service.roll({ dice: [{ type: 'd6', count: 2 }], includeDuality: false });

      const expectedTotal = result.diceResults.reduce((s, d) => s + d.value, 0);
      expect(result.total).toBe(expectedTotal);
    });

    it('rolls multiple dice types and total sums all', () => {
      const result = service.roll({
        dice: [{ type: 'd4', count: 1 }, { type: 'd8', count: 1 }],
        includeDuality: false,
      });

      const expectedTotal = result.diceResults.reduce((s, d) => s + d.value, 0);
      expect(result.total).toBe(expectedTotal);
    });

    it('rolls no dice and total is 0', () => {
      const result = service.roll({ dice: [], includeDuality: false });

      expect(result.diceResults).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('negative count dice produce negative values in diceResults', () => {
      const result = service.roll({ dice: [{ type: 'd6', count: -1 }], includeDuality: false });

      expect(result.diceResults).toHaveLength(1);
      expect(result.diceResults[0].value).toBeLessThanOrEqual(-1);
      expect(result.diceResults[0].value).toBeGreaterThanOrEqual(-6);
    });

    it('total is reduced by negative dice values', () => {
      vi.spyOn(service as unknown as { rollOne: (n: number) => number }, 'rollOne')
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(3);

      const result = service.roll({
        dice: [{ type: 'd6', count: 1 }, { type: 'd6', count: -1 }],
        includeDuality: false,
      });

      expect(result.total).toBe(1);
    });

    it('assigns correct dice type label to each result', () => {
      const result = service.roll({ dice: [{ type: 'd12', count: 1 }], includeDuality: false });

      expect(result.diceResults[0].type).toBe('d12');
    });

    it('includes label in result when provided', () => {
      const result = service.roll({ dice: [], includeDuality: false, label: 'Agility check' });

      expect(result.label).toBe('Agility check');
    });

    it('assigns a unique id to each roll', () => {
      const r1 = service.roll({ dice: [], includeDuality: false });
      const r2 = service.roll({ dice: [], includeDuality: false });

      expect(r1.id).not.toBe(r2.id);
    });

    it('assigns a timestamp to each roll', () => {
      const before = Date.now();
      const result = service.roll({ dice: [], includeDuality: false });
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('duality rolling', () => {
    it('returns null duality when includeDuality is false', () => {
      const result = service.roll({ dice: [], includeDuality: false });

      expect(result.duality).toBeNull();
    });

    it('returns duality result when includeDuality is true', () => {
      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.duality).not.toBeNull();
    });

    it('duality hope value is in range 1..12', () => {
      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.duality!.hope).toBeGreaterThanOrEqual(1);
      expect(result.duality!.hope).toBeLessThanOrEqual(12);
    });

    it('duality fear value is in range 1..12', () => {
      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.duality!.fear).toBeGreaterThanOrEqual(1);
      expect(result.duality!.fear).toBeLessThanOrEqual(12);
    });

    it('duality outcome is hope when hope > fear', () => {
      vi.spyOn(service as unknown as { rollOne: (n: number) => number }, 'rollOne')
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(3);

      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.duality!.outcome).toBe('hope');
    });

    it('duality outcome is fear when fear > hope', () => {
      vi.spyOn(service as unknown as { rollOne: (n: number) => number }, 'rollOne')
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(10);

      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.duality!.outcome).toBe('fear');
    });

    it('duality outcome is crit when hope equals fear', () => {
      vi.spyOn(service as unknown as { rollOne: (n: number) => number }, 'rollOne')
        .mockReturnValueOnce(7)
        .mockReturnValueOnce(7);

      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.duality!.outcome).toBe('crit');
    });

    it('duality hope + fear counts toward total', () => {
      vi.spyOn(service as unknown as { rollOne: (n: number) => number }, 'rollOne')
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(5);

      const result = service.roll({ dice: [], includeDuality: true });

      expect(result.total).toBe(13);
    });

    it('duality combined with non-duality dice sums correctly', () => {
      vi.spyOn(service as unknown as { rollOne: (n: number) => number }, 'rollOne')
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(6)
        .mockReturnValueOnce(3);

      const result = service.roll({ dice: [{ type: 'd6', count: 1 }], includeDuality: true });

      expect(result.total).toBe(13);
    });
  });

  describe('history', () => {
    it('starts with empty history', () => {
      expect(service.history()).toHaveLength(0);
    });

    it('prepends new rolls to history (newest first)', () => {
      service.roll({ dice: [], includeDuality: false, label: 'first' });
      service.roll({ dice: [], includeDuality: false, label: 'second' });

      expect(service.history()[0].label).toBe('second');
      expect(service.history()[1].label).toBe('first');
    });

    it('clearHistory empties the history log', () => {
      service.roll({ dice: [], includeDuality: false });
      service.roll({ dice: [], includeDuality: false });

      service.clearHistory();

      expect(service.history()).toHaveLength(0);
    });
  });

  describe('open/close/toggle', () => {
    it('starts closed', () => {
      expect(service.isOpen()).toBe(false);
    });

    it('open() sets isOpen to true', () => {
      service.open();

      expect(service.isOpen()).toBe(true);
    });

    it('close() sets isOpen to false', () => {
      service.open();
      service.close();

      expect(service.isOpen()).toBe(false);
    });

    it('toggle() flips isOpen', () => {
      service.toggle();
      expect(service.isOpen()).toBe(true);

      service.toggle();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('externalTrigger / consumePendingRequest', () => {
    it('externalTrigger sets pendingRequest', () => {
      const request = { dice: [{ type: 'd20' as const, count: 1 }], includeDuality: false };

      service.externalTrigger(request);

      expect(service.pendingRequest()).toEqual(request);
    });

    it('externalTrigger opens the roller', () => {
      const request = { dice: [], includeDuality: false };

      service.externalTrigger(request);

      expect(service.isOpen()).toBe(true);
    });

    it('consumePendingRequest returns the pending request', () => {
      const request = { dice: [], includeDuality: true };
      service.externalTrigger(request);

      const consumed = service.consumePendingRequest();

      expect(consumed).toEqual(request);
    });

    it('consumePendingRequest clears the pending request after returning it', () => {
      const request = { dice: [], includeDuality: false };
      service.externalTrigger(request);
      service.consumePendingRequest();

      expect(service.pendingRequest()).toBeNull();
    });

    it('consumePendingRequest returns null when no pending request', () => {
      expect(service.consumePendingRequest()).toBeNull();
    });
  });

  describe('theme', () => {
    it('defaults to tavern-scroll when no localStorage value', () => {
      expect(service.theme()).toBe('tavern-scroll');
    });

    it('setTheme updates the theme signal', () => {
      service.setTheme('tavern-scroll');

      expect(service.theme()).toBe('tavern-scroll');
    });

    it('setTheme persists to localStorage', () => {
      service.setTheme('tavern-scroll');

      expect(localStorage.getItem('oh-sheet:dice-roller-theme')).toBe('tavern-scroll');
    });

    it('loads saved theme from localStorage on construction', () => {
      localStorage.setItem('oh-sheet:dice-roller-theme', 'tavern-scroll');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(DiceRollerService);

      expect(freshService.theme()).toBe('tavern-scroll');
    });

    it('falls back to tavern-scroll for an unknown localStorage value', () => {
      localStorage.setItem('oh-sheet:dice-roller-theme', 'not-a-real-theme');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(DiceRollerService);

      expect(freshService.theme()).toBe('tavern-scroll');
    });

    it('all theme values in DICE_ROLLER_THEMES are valid', () => {
      for (const theme of DICE_ROLLER_THEMES) {
        service.setTheme(theme);
        expect(service.theme()).toBe(theme);
      }
    });
  });
});
