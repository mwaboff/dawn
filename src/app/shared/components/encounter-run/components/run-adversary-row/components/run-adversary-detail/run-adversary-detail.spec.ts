import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { RunAdversaryDetail } from './run-adversary-detail';
import { EncounterRunAdversaryResponse } from '../../../../../../models/encounter-run-api.model';
import { AdversaryData } from '../../../../../adversary-card/adversary-card.model';

function buildAdversary(overrides: Partial<EncounterRunAdversaryResponse> = {}): EncounterRunAdversaryResponse {
  return {
    id: 1,
    adversaryId: 10,
    hitPointsMarked: 1,
    hitPointMax: 5,
    stressMarked: 0,
    stressMax: 3,
    tokens: 0,
    isDefeated: false,
    displayOrder: 0,
    ...overrides,
  };
}

function buildStatBlock(overrides: Partial<AdversaryData> = {}): AdversaryData {
  return {
    id: 10,
    name: 'Giant Mosquito',
    tier: 1,
    adversaryType: 'SKULK',
    ...overrides,
  };
}

@Component({
  imports: [RunAdversaryDetail],
  template: `
    <app-run-adversary-detail
      [adversary]="adversary()"
      [statBlock]="statBlock()"
      [idPrefix]="'run-adversary-1'"
      [rowLabel]="'Giant Mosquito'"
      [isRetiered]="isRetiered()"
      (hpMarkedChange)="hpMarkedChange.set($event)"
      (stressMarkedChange)="stressMarkedChange.set($event)"
      (tokensChange)="tokensChange.set($event)"
      (defeatedToggle)="defeatedToggleCount.set(defeatedToggleCount() + 1)"
      (noteChange)="noteChange.set($event)"
    />
  `,
})
class TestHost {
  adversary = signal<EncounterRunAdversaryResponse>(buildAdversary());
  statBlock = signal<AdversaryData>(buildStatBlock());
  isRetiered = signal(false);
  hpMarkedChange = signal<number | null>(null);
  stressMarkedChange = signal<number | null>(null);
  tokensChange = signal<number | null>(null);
  defeatedToggleCount = signal(0);
  noteChange = signal<string | null>(null);
}

describe('RunAdversaryDetail', () => {
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

  it('should render the HP and Stress trackers with the current marked values', () => {
    const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
    expect(boxes.length).toBe(5 + 3);
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

  describe('Retiering', () => {
    // Type and tier moved out of this component entirely -- they're now the adversary row's own
    // "Solo · Tier 3" secondary line (`RunAdversaryRow.typeLabel`/`isEliteType`), so they aren't
    // duplicated between the collapsed row and this expanded detail any more. Only the
    // retiered-from marker (which references the *original* catalog tier, not the effective one)
    // stays here.
    it('should show a retiered-from marker referencing the original catalog tier when isRetiered is true', () => {
      host.isRetiered.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.run-detail__retiered').textContent).toContain('Retiered from Tier 1');
    });

    it('should not show a retiered marker when isRetiered is false', () => {
      expect(fixture.nativeElement.querySelector('.run-detail__retiered')).toBeFalsy();
    });
  });

  describe('Standard Attack', () => {
    it('should render weapon name, title-cased range, and damage', () => {
      host.statBlock.set(
        buildStatBlock({
          weaponName: 'Stinger',
          attackRange: 'VERY_CLOSE',
          damage: { notation: '1d6+1', damageType: 'physical' },
        }),
      );
      fixture.detectChanges();

      const text = fixture.nativeElement.querySelector('.run-detail__attack-text').textContent;
      expect(text).toContain('Stinger');
      expect(text).toContain('Very Close');
      expect(text).not.toContain('VERY_CLOSE');
      expect(text).toContain('1d6+1 physical');
    });

    it('should not render a Standard Attack section when there is no weapon', () => {
      expect(fixture.nativeElement.querySelector('.run-detail__attack-text')).toBeFalsy();
    });
  });

  describe('Tokens', () => {
    it('should emit 1 when incrementing from 0', () => {
      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-detail__token-btn');
      incrementBtn.click();
      fixture.detectChanges();

      expect(host.tokensChange()).toBe(1);
    });

    it('should floor at 0 and disable the decrement button', () => {
      const [decrementBtn] = fixture.nativeElement.querySelectorAll('.run-detail__token-btn');
      expect(decrementBtn.disabled).toBe(true);

      decrementBtn.click();
      fixture.detectChanges();

      expect(host.tokensChange()).toBeNull();
    });

    it('should have no maximum', () => {
      host.adversary.set(buildAdversary({ tokens: 99 }));
      fixture.detectChanges();

      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-detail__token-btn');
      incrementBtn.click();
      fixture.detectChanges();

      expect(host.tokensChange()).toBe(100);
    });
  });

  describe('Mark Defeated / Revive', () => {
    // A prior round of trimming removed the standalone "Mark Defeated" control on the assumption
    // that marking the last HP box (see `EncounterRunView.onHpChange`) covered every path to a
    // fresh defeat. It doesn't -- `isDefeated` is a flag on the model, not derived from HP, and a
    // GM narrating a surrender, a retreat, or an early end to a fight needs to mark that without
    // first maxing out HP. This restores it as an always-visible control (relabeled, not gated by
    // `isDefeated`) rather than a separate sibling button, so there's exactly one toggle either way.
    it('should render "Mark Defeated" while active, and emit defeatedToggle when clicked -- without touching HP', () => {
      const button = fixture.nativeElement.querySelector('.run-detail__defeat-toggle-btn');
      expect(button.textContent.trim()).toBe('Mark Defeated');

      button.click();

      expect(host.defeatedToggleCount()).toBe(1);
      // The toggle only ever emits `defeatedToggle` -- it has no path to hpMarkedChange at all.
      expect(host.hpMarkedChange()).toBeNull();
    });

    it('should render "Revive" once defeated, and emit defeatedToggle when clicked', () => {
      host.adversary.set(buildAdversary({ isDefeated: true }));
      fixture.detectChanges();

      const revive = fixture.nativeElement.querySelector('.run-detail__defeat-toggle-btn');
      expect(revive.textContent.trim()).toBe('Revive');
      revive.click();

      expect(host.defeatedToggleCount()).toBe(1);
    });

    it('should leave the marked HP exactly where it was after reviving a manually-defeated adversary', () => {
      // Reviving doesn't restore HP itself (that's `EncounterRunView`/the server's concern -- this
      // component only ever emits the toggle), but it must not *additionally* clobber whatever HP
      // was already marked when the parent re-renders with the flipped `isDefeated`.
      host.adversary.set(buildAdversary({ hitPointsMarked: 2, hitPointMax: 5, isDefeated: true }));
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.run-detail__defeat-toggle-btn').click();
      host.adversary.set(buildAdversary({ hitPointsMarked: 2, hitPointMax: 5, isDefeated: false }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.resource-box--marked').length).toBe(2);
    });
  });

  describe('Features, Experiences, Motives & Tactics', () => {
    it('should not render sections that have no data', () => {
      expect(fixture.nativeElement.querySelector('.run-detail__section')).toBeFalsy();
    });

    it('should render Features with their timing subtitle', () => {
      host.statBlock.set(
        buildStatBlock({ features: [{ name: 'Relentless (3)', description: 'Acts again.', subtitle: 'Passive' }] }),
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-card-feature-item')).toBeTruthy();
    });

    it('should render Experiences in the "Thief +2" form', () => {
      host.statBlock.set(buildStatBlock({ experiences: [{ description: 'Thief', modifier: 2 }] }));
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.run-detail__experience-list li');
      expect(item.textContent.trim()).toBe('Thief +2');
    });

    it('should render Motives & Tactics', () => {
      host.statBlock.set(buildStatBlock({ motivesAndTactics: 'Ambush, retreat, regroup' }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.run-detail__tactics-text').textContent.trim()).toBe(
        'Ambush, retreat, regroup',
      );
    });
  });

  describe('Notes', () => {
    it('should cap the textarea at 2000 characters', () => {
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-detail__notes-input');
      expect(textarea.maxLength).toBe(2000);
    });

    it('should not emit before the debounce elapses', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-detail__notes-input');
      textarea.value = 'Watching the north door';
      textarea.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      expect(host.noteChange()).toBeNull();
    });

    it('should emit the note after the debounce elapses', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-detail__notes-input');
      textarea.value = 'Watching the north door';
      textarea.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(500);

      expect(host.noteChange()).toBe('Watching the north door');
    });

    it('should flush a pending note to the output when destroyed before the debounce fires', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-detail__notes-input');
      textarea.value = 'Gone to check the door';
      textarea.dispatchEvent(new Event('input'));

      fixture.destroy();

      expect(host.noteChange()).toBe('Gone to check the door');
    });

    it('should not clobber an in-progress draft when an unrelated field update replaces the row', () => {
      vi.useFakeTimers();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.run-detail__notes-input');
      textarea.value = 'Still typing';
      textarea.dispatchEvent(new Event('input'));

      host.adversary.set(buildAdversary({ hitPointsMarked: 2 }));
      fixture.detectChanges();

      expect(textarea.value).toBe('Still typing');
    });
  });
});
