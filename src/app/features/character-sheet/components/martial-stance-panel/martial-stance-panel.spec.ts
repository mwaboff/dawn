import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MartialStancePanel } from './martial-stance-panel';
import { MartialStanceResponse } from '../../../../shared/models/martial-stance-api.model';

function buildStance(id: number, name: string, tier: number): MartialStanceResponse {
  return {
    id,
    name,
    tier,
    expansionId: 2,
    description: `${name} effect text.`,
    createdAt: '',
    lastModifiedAt: '',
  };
}

@Component({
  template: `
    <app-martial-stance-panel
      [knownStances]="stances()"
      [activeStanceId]="activeId()"
      [focusMarked]="focus()"
      [canAct]="canAct()"
      [actionInFlight]="inFlight()"
      (activateStance)="lastActivated = $event"
      (clearStance)="cleared = true"
    />
  `,
  imports: [MartialStancePanel],
})
class TestHost {
  stances = signal<MartialStanceResponse[]>([]);
  activeId = signal<number | null>(null);
  focus = signal(0);
  canAct = signal(true);
  inFlight = signal(false);
  lastActivated: number | null = null;
  cleared = false;
}

describe('MartialStancePanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  /** The action buttons live in the card body, so a stance must be opened before they exist. */
  function expandStance(index = 0): void {
    el.querySelectorAll<HTMLButtonElement>('.expandable-card__header')[index]?.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-martial-stance-panel')).toBeTruthy();
  });

  it('shows an empty message when no stances are known', () => {
    expect(el.querySelector('.stance-empty')).toBeTruthy();
  });

  it('renders each known stance as an expandable card', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1), buildStance(2, 'Defensive Stance', 1)]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.expandable-card--martialStance').length).toBe(2);
  });

  it('orders stances by tier, then by name', () => {
    host.stances.set([
      buildStance(3, 'Advanced Stance', 2),
      buildStance(2, 'Defensive Stance', 1),
      buildStance(1, 'Aggressive Stance', 1),
    ]);
    fixture.detectChanges();

    const names = [...el.querySelectorAll('.expandable-card__name')].map(node => node.textContent?.trim());
    expect(names).toEqual(['Aggressive Stance', 'Defensive Stance', 'Advanced Stance']);
  });

  it('shows the tier as a meta badge on the collapsed card', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 3)]);
    fixture.detectChanges();

    expect(el.querySelector('.expandable-card__meta-badge--martialStance')?.textContent).toContain('Tier 3');
  });

  it('keeps the stance body hidden until its header is clicked', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    fixture.detectChanges();
    expect(el.querySelector('.expandable-card__body')).toBeFalsy();

    expandStance();

    expect(el.querySelector('.expandable-card__body')).toBeTruthy();
    expect(el.querySelector('.expandable-card__header')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('marks the active stance with a filled Active badge', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1), buildStance(2, 'Defensive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();

    const cards = el.querySelectorAll('.expandable-card--martialStance');
    expect(cards[0].classList).toContain('expandable-card--stanceActive');
    expect(cards[0].querySelector('.expandable-card__meta-badge--active')?.textContent).toContain('Active');
    expect(cards[1].querySelector('.expandable-card__meta-badge--active')).toBeFalsy();
  });

  it('announces the active stance for screen readers', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    fixture.detectChanges();
    expect(el.querySelector('.stance-status')?.textContent).toContain('No stance active');

    host.activeId.set(1);
    fixture.detectChanges();

    expect(el.querySelector('.stance-status')?.textContent).toContain('Active stance: Aggressive Stance');
  });

  it('disables activation when Focus is empty', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.focus.set(0);
    fixture.detectChanges();
    expandStance();

    expect(el.querySelector<HTMLButtonElement>('.stance-btn')?.disabled).toBe(true);
  });

  it('emits activateStance when a stance is entered with Focus available', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.focus.set(2);
    fixture.detectChanges();
    expandStance();

    el.querySelector<HTMLButtonElement>('.stance-btn')?.click();

    expect(host.lastActivated).toBe(1);
  });

  it('offers a drop button instead of an enter button on the active stance', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    host.focus.set(2);
    fixture.detectChanges();
    expandStance();

    expect(el.querySelector('.stance-btn--clear')).toBeTruthy();
    expect(el.querySelectorAll('.stance-btn').length).toBe(1);
  });

  it('emits clearStance when the drop button is clicked', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();
    expandStance();

    el.querySelector<HTMLButtonElement>('.stance-btn--clear')?.click();

    expect(host.cleared).toBe(true);
  });

  it('does not show any action buttons when the viewer cannot act', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    host.canAct.set(false);
    fixture.detectChanges();
    expandStance();

    expect(el.querySelector('.stance-actions')).toBeFalsy();
  });

  it('renders the four drop conditions as a reminder', () => {
    const items = el.querySelectorAll('.stance-drop-reminder__list li');
    expect(items.length).toBe(4);
  });

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    function buildRestrictedStance(id: number, expansionName?: string): MartialStanceResponse {
      // `name` is real API shape only because the response type keeps it required -- a restricted
      // response never actually sends it. Left off `description`/`tier` too, matching the wire.
      return { id, name: 'ignored', expansionId: 2, createdAt: '', lastModifiedAt: '', restricted: true, expansionName };
    }

    it('does not throw sorting a mix of restricted and normal stances', () => {
      host.stances.set([buildRestrictedStance(1), buildStance(2, 'Aggressive Stance', 1)]);

      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('draws a locked placeholder instead of the expandable card', () => {
      host.stances.set([buildRestrictedStance(1, 'Hope & Fear')]);
      fixture.detectChanges();

      expect(el.querySelector('app-restricted-card-placeholder')).toBeTruthy();
      expect(el.querySelector('.expandable-card--martialStance')).toBeFalsy();
    });

    it('announces the shared placeholder title, not undefined, when the active stance is restricted', () => {
      host.stances.set([buildRestrictedStance(1)]);
      host.activeId.set(1);
      fixture.detectChanges();

      expect(el.querySelector('[role="status"]')?.textContent).toContain('Content Not Available');
      expect(el.querySelector('[role="status"]')?.textContent).not.toContain('undefined');
    });

    it('offers no Enter action on a restricted, inactive stance -- activating rules the player cannot see', () => {
      host.stances.set([buildRestrictedStance(1)]);
      host.focus.set(2);
      fixture.detectChanges();

      expect(el.querySelector('.stance-actions')).toBeFalsy();
    });

    it('still offers the Drop action on a restricted stance that is already active -- the removal exception', () => {
      host.stances.set([buildRestrictedStance(1)]);
      host.activeId.set(1);
      fixture.detectChanges();

      const dropBtn = el.querySelector<HTMLButtonElement>('.stance-btn--clear');
      expect(dropBtn).toBeTruthy();
      expect(dropBtn?.textContent).toContain('Drop stance');
      dropBtn?.click();
      expect(host.cleared).toBe(true);
    });
  });
});
