import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { EntityCard } from './entity-card';
import { EntityCardData, EntityCardSize } from './entity-card.model';
import {
  ResizeObserverStubHandle,
  installResizeObserverStub,
} from '../../testing/resize-observer.stub';

function buildCard(overrides: Partial<EntityCardData> = {}): EntityCardData {
  return {
    id: 3,
    name: 'Warden of the Elements',
    cardType: 'domainCard',
    subtitle: 'Mastery',
    headline: 'Embody an element for the rest of the scene.',
    description: 'You channel raw elemental power through your body.',
    badges: [{ label: 'Lvl', value: '3' }],
    meta: [{ label: 'Domains', value: 'Sage, Valor' }],
    features: [
      {
        name: 'Elemental Dominion',
        description: 'You further embody your element.',
        tags: ['Spell'],
        modifiers: [{ label: 'Evasion', value: 2 }],
      },
    ],
    ...overrides,
  };
}

@Component({
  imports: [EntityCard],
  template: `
    <app-entity-card
      [card]="card()"
      [size]="size()"
      [muted]="muted()"
      [headingLevel]="headingLevel()"
      (sizeChange)="onSizeChange($event)"
    >
      @if (withControls()) {
        <button card-controls type="button" class="projected-control">control</button>
      }
      @if (withActions()) {
        <button card-actions type="button" class="projected-action">action</button>
      }
    </app-entity-card>
  `,
})
class TestHost {
  card = signal<EntityCardData>(buildCard());
  size = signal<EntityCardSize>('normal');
  muted = signal(false);
  headingLevel = signal<2 | 3 | 4 | 5>(4);
  withControls = signal(false);
  withActions = signal(false);
  lastSizeChange: EntityCardSize | null = null;

  onSizeChange(size: EntityCardSize): void {
    this.lastSizeChange = size;
  }
}

/** jsdom always reports 0 for both -- this fakes an overflowing (or not) clip box. */
function setClipDimensions(el: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
}

describe('EntityCard', () => {
  let stub: ResizeObserverStubHandle;
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let root: HTMLElement;

  beforeEach(() => {
    stub = installResizeObserverStub();
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => stub.restore());

  function clip(): HTMLElement {
    return root.querySelector('.entity-card__clip')!;
  }

  function header(): HTMLElement {
    return root.querySelector('.entity-card__header')!;
  }

  /** Grows the clip past the `normal` cap and re-runs the component's ResizeObserver measurement. */
  function makeOverflow(): void {
    setClipDimensions(clip(), 400, 200);
    stub.triggerAll();
    fixture.detectChanges();
  }

  describe('sizes', () => {
    it('renders no body content at compact', () => {
      host.size.set('compact');
      fixture.detectChanges();

      expect(root.querySelector('.entity-card__body')).toBeFalsy();
    });

    it('shows the headline instead of the subtitle at compact', () => {
      host.size.set('compact');
      fixture.detectChanges();

      expect(header().textContent).toContain('Embody an element for the rest of the scene.');
      expect(header().textContent).not.toContain('Mastery');
    });

    it('renders the full header and clipped body at normal', () => {
      expect(header().textContent).toContain('Mastery');
      expect(root.querySelector('.entity-card__body')).toBeTruthy();
      expect(clip().classList.contains('entity-card__clip--expanded')).toBe(false);
    });

    it('renders the body without a height cap class at expanded', () => {
      host.size.set('expanded');
      fixture.detectChanges();

      expect(clip().classList.contains('entity-card__clip--expanded')).toBe(true);
    });
  });

  describe('toggle behaviour', () => {
    it('shows no toggle at normal size when the body does not overflow', () => {
      expect(root.querySelector('.entity-card__header--interactive')).toBeFalsy();
    });

    it('shows a toggle at normal size once the body overflows', () => {
      makeOverflow();

      expect(root.querySelector('.entity-card__header--interactive')).toBeTruthy();
    });

    it('always shows a toggle at compact, regardless of overflow', () => {
      host.size.set('compact');
      fixture.detectChanges();

      expect(root.querySelector('.entity-card__header--interactive')).toBeTruthy();
    });

    it('expands the card and emits sizeChange when the toggle is clicked', () => {
      makeOverflow();

      root.querySelector<HTMLButtonElement>('.entity-card__header--interactive')!.click();
      fixture.detectChanges();

      expect(clip().classList.contains('entity-card__clip--expanded')).toBe(true);
      expect(host.lastSizeChange).toBe('expanded');
    });

    it('collapses back to normal and emits sizeChange on a second click', () => {
      makeOverflow();
      root.querySelector<HTMLButtonElement>('.entity-card__header--interactive')!.click();
      fixture.detectChanges();

      root.querySelector<HTMLButtonElement>('.entity-card__header--interactive')!.click();
      fixture.detectChanges();

      expect(clip().classList.contains('entity-card__clip--expanded')).toBe(false);
      expect(host.lastSizeChange).toBe('normal');
    });
  });

  describe('bodyId', () => {
    it('differs for the same id across different card types', () => {
      host.card.set(buildCard({ id: 3, cardType: 'domainCard' }));
      fixture.detectChanges();
      const domainCardId = clip().id;

      host.card.set(buildCard({ id: 3, cardType: 'companion' }));
      fixture.detectChanges();
      const companionId = clip().id;

      expect(domainCardId).not.toBe(companionId);
      expect(domainCardId).toBe('entity-card-body-domainCard-3');
      expect(companionId).toBe('entity-card-body-companion-3');
    });
  });

  describe('accessibility', () => {
    it('wraps the header in a role=heading element at the configured level', () => {
      host.headingLevel.set(3);
      fixture.detectChanges();

      const heading = root.querySelector('[role="heading"]')!;
      expect(heading.getAttribute('aria-level')).toBe('3');
    });

    it('sets aria-expanded and aria-controls on the toggle button', () => {
      makeOverflow();

      const button = root.querySelector('.entity-card__header--interactive')!;
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-controls')).toBe(clip().id);

      button.dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('gives the expanded clip a scrollable group role, tabindex and label', () => {
      host.size.set('expanded');
      fixture.detectChanges();

      expect(clip().getAttribute('role')).toBe('group');
      expect(clip().getAttribute('tabindex')).toBe('0');
      expect(clip().getAttribute('aria-label')).toContain('Warden of the Elements');
    });

    it('omits role/tabindex/aria-label on the clip when not expanded', () => {
      expect(clip().hasAttribute('role')).toBe(false);
      expect(clip().hasAttribute('tabindex')).toBe(false);
      expect(clip().hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('the no-toggle branch', () => {
    it('renders the header as a plain div, not a button, when no toggle is shown', () => {
      expect(header().tagName).toBe('DIV');
      expect(root.querySelector('.entity-card__header--interactive')).toBeFalsy();
    });

    it('still renders the name and type tab in the div branch', () => {
      expect(header().querySelector('.entity-card__name')?.textContent).toContain(
        'Warden of the Elements',
      );
      expect(header().querySelector('.entity-card__tab')).toBeTruthy();
    });
  });

  describe('content projection', () => {
    it('renders projected controls and actions outside the clip', () => {
      host.withControls.set(true);
      host.withActions.set(true);
      fixture.detectChanges();

      expect(root.querySelector('.projected-control')).toBeTruthy();
      expect(root.querySelector('.projected-action')).toBeTruthy();
      expect(clip().querySelector('.projected-control')).toBeFalsy();
      expect(clip().querySelector('.projected-action')).toBeFalsy();
    });

    it('omits the controls/actions wrappers from layout when nothing is projected', () => {
      const controls = root.querySelector('.entity-card__controls')!;
      expect(controls.children.length).toBe(0);
    });
  });

  describe('overflow safety', () => {
    /* Regression for the header-clipping defect: a domain card's tab + 3 badges + chevron
       (entity-card.mapper.ts's `domainCardToEntity` gives up to three -- level, type, recall cost)
       exceeds the grid's 19rem column floor. jsdom never computes layout, so this can't assert the
       badges land on a second line -- but it can assert the property that makes that possible
       (`flex-wrap: wrap`, read from the real component stylesheet) and that every badge plus the
       toggle survive in the DOM for that wrap to have something to work with. Without the CSS fix,
       this property assertion fails; without the mapper's badge data, the DOM assertion would pass
       vacuously, which is why both are here together. */
    it('lets the header wrap instead of clipping the toggle when badges push past one line', () => {
      host.card.set(
        buildCard({
          cardType: 'domainCard',
          badges: [{ label: 'Lvl 3' }, { label: 'GRIMOIRE' }, { label: 'Recall 2' }],
        }),
      );
      makeOverflow();

      expect(getComputedStyle(header()).flexWrap).toBe('wrap');
      expect(header().querySelectorAll('.entity-card__badge').length).toBe(3);
      expect(root.querySelector('.entity-card__header--interactive')).toBeTruthy();
    });

    it('has nothing to wrap at compact, since compact renders no badges', () => {
      host.card.set(
        buildCard({
          cardType: 'domainCard',
          badges: [{ label: 'Lvl 3' }, { label: 'GRIMOIRE' }, { label: 'Recall 2' }],
        }),
      );
      host.size.set('compact');
      fixture.detectChanges();

      expect(header().querySelector('.entity-card__badges')).toBeFalsy();
    });

    /* Regression for the clipped-and-unreachable-even-expanded defect: `.entity-card__clip` keeps
       overflow-x hidden in both `normal` and `expanded` (see entity-card.css), so a long unbroken
       token needs `overflow-wrap: anywhere` on the text itself -- there is no scroll to fall back
       on. */
    it('lets body text break on a long unbroken token instead of relying on scroll', () => {
      const longToken = 'a'.repeat(200);
      host.card.set(
        buildCard({
          description: longToken,
          meta: [{ label: 'Note', value: longToken }],
          features: [{ description: longToken }],
        }),
      );
      host.size.set('expanded');
      fixture.detectChanges();

      const description = root.querySelector('.entity-card__description')!;
      const metaRow = root.querySelector('.entity-card__meta-row')!;
      const featureDescription = root.querySelector('.entity-card__feature-description')!;

      expect(getComputedStyle(description).overflowWrap).toBe('anywhere');
      expect(getComputedStyle(metaRow).overflowWrap).toBe('anywhere');
      expect(getComputedStyle(featureDescription).overflowWrap).toBe('anywhere');
    });
  });

  describe('badge glyph', () => {
    it('renders a decorative, aria-hidden glyph before a badge that has one', () => {
      host.card.set(buildCard({ badges: [{ label: 'Custom', glyph: '✦' }] }));
      fixture.detectChanges();

      const glyph = header().querySelector('.entity-card__badge-glyph')!;
      expect(glyph.textContent).toBe('✦');
      expect(glyph.getAttribute('aria-hidden')).toBe('true');
    });

    it('still renders the badge label text alongside the glyph', () => {
      host.card.set(buildCard({ badges: [{ label: 'Custom', glyph: '✦' }] }));
      fixture.detectChanges();

      expect(header().querySelector('.entity-card__badge')?.textContent).toContain('Custom');
    });

    it('renders no glyph element for a badge without one', () => {
      host.card.set(buildCard({ badges: [{ label: 'Lvl', value: '3' }] }));
      fixture.detectChanges();

      expect(header().querySelector('.entity-card__badge-glyph')).toBeFalsy();
    });
  });

  describe('feature list', () => {
    it('tracks by index so two nameless features do not collide', () => {
      host.card.set(
        buildCard({
          features: [
            { description: 'First unnamed feature.' },
            { description: 'Second unnamed feature.' },
          ],
        }),
      );

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(root.querySelectorAll('.entity-card__feature').length).toBe(2);
      expect(root.textContent).toContain('First unnamed feature.');
      expect(root.textContent).toContain('Second unnamed feature.');
    });
  });
});
