import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { RunAdversaryRow } from './run-adversary-row';
import { EncounterRunAdversaryResponse } from '../../../../models/encounter-run-api.model';
import { AdversaryApiResponse } from '../../../../models/adversary-api.model';

function buildStatBlock(overrides: Partial<AdversaryApiResponse> = {}): AdversaryApiResponse {
  return {
    id: 10,
    name: 'Giant Mosquito',
    tier: 1,
    adversaryType: 'SKULK',
    ...overrides,
  };
}

function buildRunAdversary(overrides: Partial<EncounterRunAdversaryResponse> = {}): EncounterRunAdversaryResponse {
  return {
    id: 1,
    adversaryId: 10,
    adversary: buildStatBlock(),
    hitPointsMarked: 0,
    hitPointMax: 5,
    stressMarked: 0,
    stressMax: 3,
    tokens: 0,
    isDefeated: false,
    displayOrder: 0,
    ...overrides,
  };
}

@Component({
  imports: [RunAdversaryRow],
  template: `
    <app-run-adversary-row
      [adversary]="adversary()"
      [density]="density()"
      (hpMarkedChange)="hpMarkedChange.set($event)"
      (stressMarkedChange)="stressMarkedChange.set($event)"
      (tokensChange)="tokensChange.set($event)"
      (defeatedToggle)="defeatedToggleCount.set(defeatedToggleCount() + 1)"
      (noteChange)="noteChange.set($event)"
    />
  `,
})
class TestHost {
  adversary = signal<EncounterRunAdversaryResponse>(buildRunAdversary());
  density = signal<'comfortable' | 'compact'>('comfortable');
  hpMarkedChange = signal<number | null>(null);
  stressMarkedChange = signal<number | null>(null);
  tokensChange = signal<number | null>(null);
  defeatedToggleCount = signal(0);
  noteChange = signal<string | null>(null);
}

describe('RunAdversaryRow', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the adversary card with the mapped stat block', () => {
    const name = fixture.nativeElement.querySelector('.adversary-card__name');
    expect(name.textContent.trim()).toBe('Giant Mosquito');
  });

  it('should render a fallback when the run instance has no expanded stat block', () => {
    host.adversary.set(buildRunAdversary({ adversary: undefined }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.run-row--error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-adversary-card')).toBeFalsy();
  });

  it('should give two rendered instances distinct HP box ids, keyed on the run instance id', () => {
    const other = TestBed.createComponent(TestHost);
    other.componentInstance.adversary.set(buildRunAdversary({ id: 2, adversary: buildStatBlock({ id: 10 }) }));
    other.detectChanges();

    const thisBox = fixture.nativeElement.querySelector('.resource-box');
    const otherBox = other.nativeElement.querySelector('.resource-box');
    expect(thisBox.id).not.toBe(otherBox.id);
    expect(thisBox.id).toContain('run-adversary-1');
    expect(otherBox.id).toContain('run-adversary-2');
  });

  it('should emit the absolute HP value when a box is clicked', () => {
    const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
    boxes[2].click();
    fixture.detectChanges();

    expect(host.hpMarkedChange()).toBe(3);
  });

  it('should emit the absolute Stress value when a box is clicked', () => {
    const trackers = fixture.nativeElement.querySelectorAll('app-resource-tracker');
    const stressBoxes = trackers[1].querySelectorAll('.resource-box');
    stressBoxes[0].click();
    fixture.detectChanges();

    expect(host.stressMarkedChange()).toBe(1);
  });

  describe('Tokens', () => {
    it('should emit 1 when incrementing from 0', () => {
      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-row__token-btn');
      incrementBtn.click();
      fixture.detectChanges();

      expect(host.tokensChange()).toBe(1);
    });

    it('should floor at 0 and disable the decrement button', () => {
      const [decrementBtn] = fixture.nativeElement.querySelectorAll('.run-row__token-btn');
      expect(decrementBtn.disabled).toBe(true);

      decrementBtn.click();
      fixture.detectChanges();

      expect(host.tokensChange()).toBeNull();
    });

    it('should have no maximum', () => {
      host.adversary.set(buildRunAdversary({ tokens: 99 }));
      fixture.detectChanges();

      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-row__token-btn');
      incrementBtn.click();
      fixture.detectChanges();

      expect(host.tokensChange()).toBe(100);
    });
  });

  describe('Defeat', () => {
    it('should not show a Defeated badge when active', () => {
      expect(fixture.nativeElement.querySelector('.run-row__defeated-badge')).toBeFalsy();
    });

    it('should show a Defeated text badge when isDefeated is true', () => {
      host.adversary.set(buildRunAdversary({ isDefeated: true }));
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.run-row__defeated-badge');
      expect(badge.textContent.trim()).toBe('Defeated');
    });

    it('should emit defeatedToggle when the toggle button is clicked', () => {
      const toggle = fixture.nativeElement.querySelector('.run-row__defeat-btn');
      toggle.click();

      expect(host.defeatedToggleCount()).toBe(1);
    });

    it('should offer a Revive label when already defeated, so the GM can undo the second-chance case', () => {
      host.adversary.set(buildRunAdversary({ isDefeated: true }));
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.run-row__defeat-btn');
      expect(toggle.textContent.trim()).toBe('Revive');
    });
  });

  describe('Notes', () => {
    it('should cap the textarea at 2000 characters', () => {
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-row__notes-input');
      expect(textarea.maxLength).toBe(2000);
    });

    it('should not emit before the debounce elapses', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-row__notes-input');
      textarea.value = 'Watching the north door';
      textarea.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      expect(host.noteChange()).toBeNull();
    });

    it('should emit the note after the debounce elapses', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-row__notes-input');
      textarea.value = 'Watching the north door';
      textarea.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(500);

      expect(host.noteChange()).toBe('Watching the north door');
    });

    it('should flush a pending note to the output when destroyed before the debounce fires', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-row__notes-input');
      textarea.value = 'Gone to check the door';
      textarea.dispatchEvent(new Event('input'));

      fixture.destroy();

      expect(host.noteChange()).toBe('Gone to check the door');
    });

    it('should not clobber an in-progress draft when an unrelated field update replaces the row', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-row__notes-input');
      textarea.value = 'Still typing';
      textarea.dispatchEvent(new Event('input'));

      // A different action on the same row (e.g. an HP mark) replaces the whole run adversary
      // object with the server's response before the note debounce has fired.
      host.adversary.set(buildRunAdversary({ hitPointsMarked: 2 }));
      fixture.detectChanges();

      expect(textarea.value).toBe('Still typing');
    });
  });

  describe('Density', () => {
    it('should apply the compact modifier when density is compact', () => {
      host.density.set('compact');
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('.run-row');
      expect(row.classList.contains('run-row--compact')).toBe(true);
    });
  });

  describe('narrow width', () => {
    // The GM panel's grid floors a column at `minmax(300px, 1fr)` (gm-panel-grid.css), and
    // `.adversary-card` clips overflow for its rounded corners -- anything that can't wrap or
    // shrink inside it at that width gets silently cut off the right edge instead of dropping to
    // a new line. That exact failure already shipped once (the header name vs. card-actions
    // cluster); this guards every other control in the row against the same shape of bug.
    beforeEach(() => {
      fixture.nativeElement.style.display = 'block';
      fixture.nativeElement.style.width = '300px';
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
    });

    it('keeps HP, Stress, token, defeat, and notes controls visible', () => {
      const controls: HTMLElement[] = [
        fixture.nativeElement.querySelector('.resource-box'),
        fixture.nativeElement.querySelector('.run-row__token-btn'),
        fixture.nativeElement.querySelector('.run-row__defeat-btn'),
        fixture.nativeElement.querySelector('.run-row__notes-input'),
      ];

      for (const control of controls) {
        expect(control).toBeTruthy();
        const style = getComputedStyle(control);
        expect(style.display).not.toBe('none');
        expect(style.visibility).not.toBe('hidden');
      }
    });

    it('lets the header, actions, and counters clusters wrap instead of overflowing the clipped card', () => {
      const headerMain = fixture.nativeElement.querySelector('.adversary-card__header-main');
      const actions = fixture.nativeElement.querySelector('.run-row__actions');
      const counters = fixture.nativeElement.querySelector('.run-row__counters');

      expect(getComputedStyle(headerMain).flexWrap).toBe('wrap');
      expect(getComputedStyle(actions).flexWrap).toBe('wrap');
      // `.run-row__counters` sets the `flex-flow` shorthand rather than `flex-wrap` directly.
      expect(getComputedStyle(counters).flexFlow).toContain('wrap');
    });

    it('keeps every control clickable at that width', () => {
      const hpBox = fixture.nativeElement.querySelector('.resource-box');
      hpBox.click();
      fixture.detectChanges();
      expect(host.hpMarkedChange()).toBe(1);

      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-row__token-btn');
      incrementBtn.click();
      fixture.detectChanges();
      expect(host.tokensChange()).toBe(1);

      const defeatBtn = fixture.nativeElement.querySelector('.run-row__defeat-btn');
      defeatBtn.click();
      expect(host.defeatedToggleCount()).toBe(1);
    });
  });
});
