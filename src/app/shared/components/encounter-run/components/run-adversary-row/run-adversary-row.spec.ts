import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { RunAdversaryRow } from './run-adversary-row';
import { RunAdversaryDetail } from './components/run-adversary-detail/run-adversary-detail';
import { EncounterRunAdversaryResponse } from '../../../../models/encounter-run-api.model';
import { AdversaryApiResponse } from '../../../../models/adversary-api.model';

function buildStatBlock(overrides: Partial<AdversaryApiResponse> = {}): AdversaryApiResponse {
  return {
    id: 10,
    name: 'Giant Mosquito',
    tier: 1,
    adversaryType: 'SKULK',
    difficulty: 12,
    majorThreshold: 4,
    severeThreshold: 8,
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

  function toggle(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.stat-row__toggle');
  }

  it('should render the name and Difficulty on the row -- never Evasion, which adversaries do not have', () => {
    const text = toggle().textContent;
    expect(text).toContain('Giant Mosquito');
    expect(text).toContain('12'); // Difficulty
    expect(fixture.nativeElement.textContent).not.toContain('Evasion');
  });

  describe('Secondary identity line (type + tier)', () => {
    it('shows the book-printed type and effective tier, title-cased, joined by a middot', () => {
      const secondary = fixture.nativeElement.querySelector('.stat-row__secondary');
      expect(secondary.textContent.trim()).toBe('Skulk · Tier 1');
      expect(secondary.textContent).not.toContain('SKULK');
    });

    it('shows the overridden (retiered) tier, not the catalog tier', () => {
      host.adversary.set(buildRunAdversary({ tierOverride: 3 }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.stat-row__secondary').textContent.trim()).toBe('Skulk · Tier 3');
    });

    it('marks elite types (Bruiser/Horde/Leader/Solo) visually distinct on the type segment', () => {
      host.adversary.set(buildRunAdversary({ adversary: buildStatBlock({ adversaryType: 'SOLO' }) }));
      fixture.detectChanges();

      const type = fixture.nativeElement.querySelector('.stat-row__secondary-type');
      expect(type.textContent.trim()).toBe('Solo');
      expect(type.classList.contains('stat-row__secondary-type--elite')).toBe(true);
    });

    it('does not mark a non-elite type', () => {
      const type = fixture.nativeElement.querySelector('.stat-row__secondary-type');
      expect(type.classList.contains('stat-row__secondary-type--elite')).toBe(false);
    });

    // Regression coverage: the name line and the secondary line used to both land as *nested*
    // children of one single projected element, so `.stat-row__identity`'s `flex-direction: column`
    // (in the global stylesheet, unreadable by jsdom -- see the describe block above) had only one
    // real flex item and never governed their stacking; it worked by accident because the name
    // line happened to be `display: flex` (block-level), pushing the secondary line down as a side
    // effect. That's exactly what broke the environment row, which had no such block-level sibling
    // and rendered name and type concatenated on one line. The fix makes both lines *direct*
    // children of `.stat-row__identity` (two separate `<ng-content>` slots in `RunStatRow`, not one
    // slot with everything nested inside), so stacking is guaranteed by flexbox itself. This is the
    // one thing jsdom *can* verify here, since it's DOM structure, not the CSS cascade.
    it('renders the name line and the secondary line as direct siblings under the identity block, not nested inside each other', () => {
      const identity = fixture.nativeElement.querySelector('.stat-row__identity');
      const nameLine = fixture.nativeElement.querySelector('.stat-row__name-line');
      const secondary = fixture.nativeElement.querySelector('.stat-row__secondary');

      expect(nameLine.parentElement).toBe(identity);
      expect(secondary.parentElement).toBe(identity);
      expect(identity.children.length).toBe(2);
    });
  });

  // `.stat-row__vital`/`.stat-row__name`/etc. are authored in *this* component's template but
  // projected into `RunStatRow` via `[row-vitals]`/`[row-identity]`. This used to be a real bug:
  // Angular's emulated encapsulation stamps projected content with the *projecting* component's
  // `_ngcontent-*` attribute, not the host's, so a rule declared in a component-scoped `styleUrl`
  // (as these classes' rules used to be) could never match it. The fix promoted these rules to
  // `shared/styles/stat-row.css`, a global (unscoped) stylesheet reachable from any element
  // regardless of which component projected it -- structurally immune to the same bug.
  //
  // These assert class-name presence only, not computed style values: `src/styles.css`'s global
  // cascade is bundled for the real app, but this project's Vitest/jsdom test environment does not
  // apply it to elements the way it applies a component's own scoped `styleUrl` (confirmed by
  // direct probe -- an ad-hoc `.btn.btn--primary` element reads no declared properties from the
  // same global sheet under `getComputedStyle` in a test). The actual declared values (`display:
  // flex`, `font-weight: 700`, etc.) were verified instead against the real compiled CSS output
  // (`npm run build`, grepping the emitted bundle for these selectors) -- see the team report for
  // specifics.
  describe('Projected vital/identity styling (ng-content + emulated encapsulation)', () => {
    it('wires the vital value/label into the shared .stat-row__vital markup structure', () => {
      const vital = fixture.nativeElement.querySelector('.stat-row__vital');
      expect(vital.querySelector('b')).toBeTruthy();
      expect(vital.querySelector('small')).toBeTruthy();
    });

    it('wires the adversary name into the shared .stat-row__name class', () => {
      expect(fixture.nativeElement.querySelector('.stat-row__name')).toBeTruthy();
    });
  });

  it('should show HP marked/max, Stress marked/max, thresholds, and tokens as plain numbers', () => {
    host.adversary.set(buildRunAdversary({ hitPointsMarked: 2, hitPointMax: 5, stressMarked: 1, stressMax: 3, tokens: 4 }));
    fixture.detectChanges();

    const text = toggle().textContent;
    expect(text).toContain('2/5');
    expect(text).toContain('1/3');
    expect(text).toContain('4/8'); // Maj/Sev
    expect(text).toContain('4'); // tokens
  });

  it('should show the bare ATK modifier, not the weapon/range/damage detail', () => {
    host.adversary.set(
      buildRunAdversary({
        adversary: buildStatBlock({
          attackModifier: 2,
          weaponName: 'Stinger',
          attackRange: 'VERY_CLOSE',
          damage: { notation: '1d6+1', damageType: 'physical' },
        }),
      }),
    );
    fixture.detectChanges();

    const text = toggle().textContent;
    expect(text).toContain('+2');
    expect(text).not.toContain('Stinger');
    expect(text).not.toContain('VERY_CLOSE');
  });

  it('should omit the ATK vital entirely when the adversary has no attack modifier', () => {
    expect(toggle().textContent).not.toContain('ATK');
  });

  it('should show the catalog name alongside the nickname once one differs from it', () => {
    host.adversary.set(buildRunAdversary({ label: 'Stingy' }));
    fixture.detectChanges();

    expect(toggle().querySelector('.stat-row__name')!.textContent!.trim()).toBe('Stingy');
    expect(toggle().querySelector('.stat-row__catalog-name')!.textContent!.trim()).toBe('Giant Mosquito');
  });

  it('should not show a redundant catalog name when there is no nickname', () => {
    expect(fixture.nativeElement.querySelector('.stat-row__catalog-name')).toBeFalsy();
  });

  describe('Defeated state', () => {
    it('should show no skull glyph while active, and reserve no space for one', () => {
      // No reserved fixed-width slot any more (the user was explicit: "I'm ok if the skull
      // pushes the name to the right slightly") -- when inactive, there's simply no skull element
      // at all, not an empty placeholder holding its width.
      expect(fixture.nativeElement.querySelector('.stat-row__skull')).toBeFalsy();
    });

    it('should show a skull glyph with an accessible name once defeated, immediately before the name in DOM order', () => {
      host.adversary.set(buildRunAdversary({ isDefeated: true }));
      fixture.detectChanges();

      const skull = fixture.nativeElement.querySelector('.stat-row__skull');
      expect(skull).toBeTruthy();
      expect(skull.getAttribute('aria-label')).toBe('Giant Mosquito is defeated');
      // The glyph itself carries no redundant announcement -- the wrapper's aria-label is the
      // single accessible name, and the SVG is aria-hidden.
      expect(skull.querySelector('svg').getAttribute('aria-hidden')).toBe('true');

      // Leading, not trailing -- a fixed column of skulls is scannable in one downward glance;
      // a trailing marker would land at a different x-position on every row since names vary.
      // Asserted via DOM order now rather than a fixed-width reserved slot (see the test above).
      const nameLine = fixture.nativeElement.querySelector('.stat-row__name-line');
      const name = nameLine.querySelector('.stat-row__name');
      expect(skull.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('should dim the row when defeated, supplementary to the skull glyph', () => {
      host.adversary.set(buildRunAdversary({ isDefeated: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.stat-row__item--muted')).toBeTruthy();
    });
  });

  it('should render a fallback when the run instance has no expanded stat block', () => {
    host.adversary.set(buildRunAdversary({ adversary: undefined }));
    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector('.stat-row__item--error');
    expect(fallback).toBeTruthy();
    // A plain div, not an <li> -- this component's own host already carries role="listitem" (see
    // its doc comment), so an inner element repeating that role would be a nested listitem.
    expect(fallback.tagName).toBe('DIV');
    expect(fixture.nativeElement.querySelector('.stat-row__toggle')).toBeFalsy();
  });

  it('should give two rendered instances distinct detail ids, keyed on the run instance id', () => {
    const other = TestBed.createComponent(TestHost);
    other.componentInstance.adversary.set(buildRunAdversary({ id: 2, adversary: buildStatBlock({ id: 10 }) }));
    other.detectChanges();

    expect(toggle().getAttribute('aria-controls')).toBe('run-adversary-1-detail');
    expect(other.nativeElement.querySelector('.stat-row__toggle').getAttribute('aria-controls')).toBe(
      'run-adversary-2-detail',
    );
  });

  it('should mark its own host as a list item, for the run view\'s role="list" container', () => {
    expect(fixture.nativeElement.querySelector('app-run-adversary-row').getAttribute('role')).toBe('listitem');
  });

  describe('Expand/collapse', () => {
    it('starts collapsed, with the detail panel hidden', () => {
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      const detail = fixture.nativeElement.querySelector('[id="run-adversary-1-detail"]');
      expect(detail.hidden).toBe(true);
    });

    it('expands and un-hides the detail panel on click', () => {
      toggle().click();
      fixture.detectChanges();

      expect(toggle().getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('[id="run-adversary-1-detail"]').hidden).toBe(false);
    });

    it('collapses again on a second click', () => {
      toggle().click();
      fixture.detectChanges();
      toggle().click();
      fixture.detectChanges();

      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('renders the detail child with the adversary, mapped stat block, and retiering', () => {
      host.adversary.set(buildRunAdversary({ tierOverride: 3 }));
      fixture.detectChanges();
      toggle().click();
      fixture.detectChanges();

      const detail = fixture.debugElement.query(By.directive(RunAdversaryDetail)).componentInstance;
      expect(detail.adversary().id).toBe(1);
      expect(detail.statBlock().name).toBe('Giant Mosquito');
      expect(detail.isRetiered()).toBe(true);
    });
  });

  describe('Detail wiring', () => {
    // The detail child's own control behaviour (HP/Stress boxes, tokens, Mark Defeated/Revive,
    // notes debounce) is covered in its own spec; this only checks the row forwards its outputs
    // unchanged.
    it('forwards hpMarkedChange, stressMarkedChange, tokensChange, defeatedToggle, and noteChange', () => {
      toggle().click();
      fixture.detectChanges();

      const detail = fixture.debugElement.query(By.directive(RunAdversaryDetail)).componentInstance;
      detail.hpMarkedChange.emit(3);
      detail.stressMarkedChange.emit(1);
      detail.tokensChange.emit(2);
      detail.defeatedToggle.emit();
      detail.noteChange.emit('Watching the door');

      expect(host.hpMarkedChange()).toBe(3);
      expect(host.stressMarkedChange()).toBe(1);
      expect(host.tokensChange()).toBe(2);
      expect(host.defeatedToggleCount()).toBe(1);
      expect(host.noteChange()).toBe('Watching the door');
    });
  });

  describe('Density', () => {
    it('should apply the compact modifier when density is compact', () => {
      host.density.set('compact');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.stat-row__item--compact')).toBeTruthy();
    });
  });

  describe('narrow width', () => {
    // The GM panel's grid floors a column at `minmax(300px, 1fr)` (gm-panel-grid.css) -- the row
    // is now a single disclosure button with no other interactive content, so this just confirms
    // it stays visible and clickable at that width.
    beforeEach(() => {
      fixture.nativeElement.style.display = 'block';
      fixture.nativeElement.style.width = '300px';
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
    });

    it('keeps the toggle visible and clickable at 300px', () => {
      const style = getComputedStyle(toggle());
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');

      toggle().click();
      fixture.detectChanges();
      expect(toggle().getAttribute('aria-expanded')).toBe('true');
    });

    // The wrap-at-narrow-width behaviour itself (`.stat-row__name-line`/`.stat-row__vitals`'s
    // `flex-wrap`) is declared in the global `shared/styles/stat-row.css` now, which this test
    // environment doesn't apply (see the describe block above) -- verified against the compiled
    // build output instead, alongside the container-query override in `run-stat-row.css` that
    // tightens `.stat-row__vitals`'s gap below 360px.
  });
});
