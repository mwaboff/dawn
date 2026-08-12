import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TransformationPanel } from './transformation-panel';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';

function buildCard(overrides: Partial<TransformationCardResponse> = {}): TransformationCardResponse {
  return {
    id: 1,
    name: 'Demigod',
    description: 'A divine burden.',
    expansionId: 2,
    features: [
      { id: 1, name: 'Divine Blessing', description: 'You are blessed.' },
      { id: 2, name: 'Heavy Burden', description: 'It costs you.' },
    ],
    questions: [
      { id: 1, questionText: 'What deity favors you?' },
      { id: 2, questionText: 'What did it cost you?' },
    ],
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

const CATALOG: TransformationCardResponse[] = [
  buildCard(),
  buildCard({ id: 2, name: 'Vampire' }),
  buildCard({ id: 3, name: 'Werewolf' }),
];

@Component({
  template: `
    <app-transformation-panel
      [card]="card()"
      [catalog]="catalog()"
      [catalogLoading]="catalogLoading()"
      [catalogError]="catalogError()"
      [isOwner]="isOwner()"
      [tokens]="tokens()"
      [wolfFormActive]="wolfFormActive()"
      [canAct]="canAct()"
      (tokensChange)="lastTokens = $event"
      (wolfFormToggle)="lastWolfForm = $event"
      (cardSelected)="lastSelected = $event"
      (cardRemoved)="removedCalled = true"
    />
  `,
  imports: [TransformationPanel],
})
class TestHost {
  card = signal<TransformationCardResponse | null>(buildCard());
  catalog = signal<TransformationCardResponse[]>(CATALOG);
  catalogLoading = signal(false);
  catalogError = signal(false);
  isOwner = signal(true);
  tokens = signal<number | null>(null);
  wolfFormActive = signal(false);
  canAct = signal(true);
  lastTokens: number | null = null;
  lastWolfForm: boolean | null = null;
  lastSelected: number | null = null;
  removedCalled = false;
}

describe('TransformationPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  function expandBody(): void {
    el.querySelector<HTMLButtonElement>('.expandable-card__header')?.click();
    fixture.detectChanges();
  }

  function badges(): string[] {
    return Array.from(el.querySelectorAll('.expandable-card__meta-badge')).map(b => b.textContent?.trim() ?? '');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-transformation-panel')).toBeTruthy();
  });

  describe('collapsed header', () => {
    it('renders collapsed on init', () => {
      expect(el.querySelector('.expandable-card__body')).toBeFalsy();
    });

    it('marks the header as not expanded on init', () => {
      expect(el.querySelector('.expandable-card__header')?.getAttribute('aria-expanded')).toBe('false');
    });

    it('reveals the body when the header is clicked', () => {
      expandBody();
      expect(el.querySelector('.expandable-card__body')).toBeTruthy();
    });

    it('collapses the body again on a second click', () => {
      expandBody();
      expandBody();
      expect(el.querySelector('.expandable-card__body')).toBeFalsy();
    });

    it('shows the attached card name', () => {
      expect(el.querySelector('.expandable-card__name')?.textContent).toContain('Demigod');
    });

    it('shows a placeholder name when no card is attached', () => {
      host.card.set(null);
      fixture.detectChanges();
      expect(el.querySelector('.expandable-card__name')?.textContent).toContain('No transformation');
    });

    it('shows no badges when no card is attached', () => {
      host.card.set(null);
      fixture.detectChanges();
      expect(badges()).toEqual([]);
    });

    it('shows no badges for a card with neither mechanic', () => {
      expect(badges()).toEqual([]);
    });

    it('shows the Feed count for a Vampire', () => {
      host.card.set(buildCard({ name: 'Vampire' }));
      host.tokens.set(3);
      fixture.detectChanges();
      expect(badges()).toEqual(['Feed 3/6']);
    });

    it('marks the Feed badge depleted at 0 tokens', () => {
      host.card.set(buildCard({ name: 'Vampire' }));
      host.tokens.set(0);
      fixture.detectChanges();
      expect(el.querySelector('.expandable-card__meta-badge--depleted')).toBeTruthy();
    });

    it('does not mark the Feed badge depleted above 0 tokens', () => {
      host.card.set(buildCard({ name: 'Vampire' }));
      host.tokens.set(1);
      fixture.detectChanges();
      expect(el.querySelector('.expandable-card__meta-badge--depleted')).toBeFalsy();
    });

    it('reads "Human form" for an inactive Werewolf', () => {
      host.card.set(buildCard({ name: 'Werewolf' }));
      fixture.detectChanges();
      expect(badges()).toEqual(['Human form']);
    });

    it('does not mark the inactive Werewolf badge active', () => {
      host.card.set(buildCard({ name: 'Werewolf' }));
      fixture.detectChanges();
      expect(el.querySelector('.expandable-card__meta-badge--active')).toBeFalsy();
    });

    it('reads "Wolf form" for an active Werewolf', () => {
      host.card.set(buildCard({ name: 'Werewolf' }));
      host.wolfFormActive.set(true);
      fixture.detectChanges();
      expect(badges()).toEqual(['Wolf form']);
    });

    it('marks the active Werewolf badge active', () => {
      host.card.set(buildCard({ name: 'Werewolf' }));
      host.wolfFormActive.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.expandable-card__meta-badge--active')).toBeTruthy();
    });
  });

  describe('expanded body', () => {
    beforeEach(() => expandBody());

    it('renders both features', () => {
      expect(el.querySelectorAll('.transformation-feature').length).toBe(2);
    });

    it('does not render questions even when the card carries them', () => {
      expect(el.querySelector('.transformation-questions')).toBeFalsy();
      expect(el.textContent).not.toContain('What deity favors you?');
    });

    it('does not show Feed tokens or Wolf Form for a non-special card', () => {
      expect(el.querySelector('.feed-tokens')).toBeFalsy();
      expect(el.querySelector('.wolf-form')).toBeFalsy();
    });

    describe('Vampire', () => {
      beforeEach(() => {
        host.card.set(buildCard({ name: 'Vampire' }));
        host.tokens.set(3);
        fixture.detectChanges();
      });

      it('shows the Feed token pool', () => {
        expect(el.querySelector('.feed-tokens__value')?.textContent).toContain('3/6');
      });

      it('does not show Wolf Form', () => {
        expect(el.querySelector('.wolf-form')).toBeFalsy();
      });

      it('emits an incremented token count', () => {
        el.querySelector<HTMLButtonElement>('.feed-tokens__btn:last-of-type')?.click();
        expect(host.lastTokens).toBe(4);
      });

      it('clamps tokens at the max of 6', () => {
        host.tokens.set(6);
        fixture.detectChanges();
        const addBtn = el.querySelectorAll<HTMLButtonElement>('.feed-tokens__btn')[1];
        expect(addBtn.disabled).toBe(true);
      });

      it('clamps tokens at a minimum of 0', () => {
        host.tokens.set(0);
        fixture.detectChanges();
        const removeBtn = el.querySelectorAll<HTMLButtonElement>('.feed-tokens__btn')[0];
        expect(removeBtn.disabled).toBe(true);
        expect(el.querySelector('.feed-tokens__warning')).toBeTruthy();
      });
    });

    describe('Werewolf', () => {
      beforeEach(() => {
        host.card.set(buildCard({ name: 'Werewolf' }));
        fixture.detectChanges();
      });

      it('shows the Wolf Form toggle', () => {
        expect(el.querySelector('.wolf-form')).toBeTruthy();
      });

      it('does not show Feed tokens', () => {
        expect(el.querySelector('.feed-tokens')).toBeFalsy();
      });

      it('emits the toggled state when clicked', () => {
        el.querySelector<HTMLButtonElement>('.wolf-form__toggle')?.click();
        expect(host.lastWolfForm).toBe(true);
      });
    });

    it('does not emit changes when canAct is false', () => {
      host.card.set(buildCard({ name: 'Vampire' }));
      host.tokens.set(3);
      host.canAct.set(false);
      fixture.detectChanges();

      const buttons = el.querySelectorAll<HTMLButtonElement>('.feed-tokens__btn');
      expect(buttons[0].disabled).toBe(true);
      expect(buttons[1].disabled).toBe(true);
    });

    describe('empty state', () => {
      beforeEach(() => {
        host.card.set(null);
        fixture.detectChanges();
      });

      it('shows the empty state copy instead of card details', () => {
        expect(el.querySelector('.transformation-empty')).toBeTruthy();
        expect(el.querySelector('.transformation-features')).toBeFalsy();
      });

      it('tells an owner their GM opened transformations', () => {
        expect(el.querySelector('.transformation-empty__copy')?.textContent).toContain('Your GM opened transformations');
      });

      it('gives a non-owner the bare fact instead of instructions', () => {
        host.isOwner.set(false);
        fixture.detectChanges();
        expect(el.querySelector('.transformation-empty__copy')?.textContent).toContain('No transformation chosen yet.');
      });

      it('shows the Choose a transformation action for an owner', () => {
        const btn = el.querySelector('.transformation-empty .transformation-action-btn');
        expect(btn?.textContent).toContain('Choose a transformation');
      });

      it('hides the Add action for a non-owner', () => {
        host.isOwner.set(false);
        fixture.detectChanges();
        expect(el.querySelector('.transformation-action-btn')).toBeFalsy();
      });

      it('opens the picker when Choose a transformation is clicked', () => {
        el.querySelector<HTMLButtonElement>('.transformation-empty .transformation-action-btn')?.click();
        fixture.detectChanges();
        expect(el.querySelector('.transformation-picker')).toBeTruthy();
        expect(el.querySelectorAll('app-daggerheart-card').length).toBe(CATALOG.length);
      });

      it('emits the selected card id and closes the picker on selection', () => {
        el.querySelector<HTMLButtonElement>('.transformation-empty .transformation-action-btn')?.click();
        fixture.detectChanges();

        el.querySelector<HTMLElement>('.transformation-picker app-daggerheart-card .card')?.click();
        fixture.detectChanges();

        expect(host.lastSelected).toBe(CATALOG[0].id);
        expect(el.querySelector('.transformation-picker')).toBeFalsy();
      });

      it('does not open the picker when canAct is false', () => {
        host.canAct.set(false);
        fixture.detectChanges();
        el.querySelector<HTMLButtonElement>('.transformation-empty .transformation-action-btn')?.click();
        fixture.detectChanges();
        expect(el.querySelector('.transformation-picker')).toBeFalsy();
      });
    });

    describe('attached card actions', () => {
      it('shows Change and Remove for an owner', () => {
        const actions = el.querySelectorAll('.transformation-action-btn');
        expect(Array.from(actions).map(a => a.textContent?.trim())).toEqual(['Change', 'Remove']);
      });

      it('hides Change and Remove for a non-owner', () => {
        host.isOwner.set(false);
        fixture.detectChanges();
        expect(el.querySelector('.transformation-action-btn')).toBeFalsy();
      });

      it('emits cardRemoved when Remove is clicked', () => {
        const buttons = el.querySelectorAll<HTMLButtonElement>('.transformation-action-btn');
        buttons[1].click();
        expect(host.removedCalled).toBe(true);
      });

      it('opens the picker showing the current card selected when Change is clicked', () => {
        const buttons = el.querySelectorAll<HTMLButtonElement>('.transformation-action-btn');
        buttons[0].click();
        fixture.detectChanges();
        expect(el.querySelector('.transformation-picker')).toBeTruthy();
      });

      it('emits the newly picked card id -- a replace, not an addition -- when changing', () => {
        const changeBtn = el.querySelectorAll<HTMLButtonElement>('.transformation-action-btn')[0];
        changeBtn.click();
        fixture.detectChanges();

        const cards = el.querySelectorAll<HTMLElement>('.transformation-picker app-daggerheart-card .card');
        cards[1].click();
        fixture.detectChanges();

        expect(host.lastSelected).toBe(CATALOG[1].id);
      });
    });
  });

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    function buildRestrictedCard(overrides: Partial<TransformationCardResponse> = {}): TransformationCardResponse {
      // `name` is real API shape only because the response type keeps it required -- a restricted
      // response never actually sends it. `description`/`features` are left off too, matching the
      // wire.
      return { id: 9, name: 'ignored', expansionId: 2, createdAt: '', lastModifiedAt: '', restricted: true, ...overrides };
    }

    it('shows the shared locked title instead of "No transformation" for a restricted, attached card', () => {
      host.card.set(buildRestrictedCard());
      fixture.detectChanges();

      expect(el.querySelector('.expandable-card__name')?.textContent).toContain('Content Not Available');
      expect(el.querySelector('.expandable-card__name')?.textContent).not.toContain('No transformation');
    });

    it('shows a lock icon and locked message instead of description/features once expanded', () => {
      host.card.set(buildRestrictedCard({ expansionName: 'Hope & Fear' }));
      fixture.detectChanges();
      expandBody();

      expect(el.querySelector('.transformation-locked app-lock-icon')).toBeTruthy();
      expect(el.querySelector('.transformation-locked__message')?.textContent).toContain('Hope & Fear');
      expect(el.querySelector('.transformation-feature')).toBeFalsy();
    });

    it('shows no Feed Tokens or Wolf Form for a restricted card, even one named Vampire/Werewolf', () => {
      host.card.set(buildRestrictedCard());
      fixture.detectChanges();
      expandBody();

      expect(el.querySelector('.feed-tokens')).toBeFalsy();
      expect(el.querySelector('.wolf-form')).toBeFalsy();
    });

    it('offers no Change action on a restricted card -- swapping is not the removal exception', () => {
      host.card.set(buildRestrictedCard());
      fixture.detectChanges();
      expandBody();

      const actions = Array.from(el.querySelectorAll('.transformation-action-btn')).map(a => a.textContent?.trim());
      expect(actions).toEqual(['Remove']);
    });

    it('still offers Remove on a restricted card -- otherwise the player is stuck in a form they cannot see', () => {
      host.card.set(buildRestrictedCard());
      fixture.detectChanges();
      expandBody();

      el.querySelector<HTMLButtonElement>('.transformation-action-btn--remove')?.click();

      expect(host.removedCalled).toBe(true);
    });

    it('degrades to a generic message rather than interpolating "undefined" when expansionName is absent', () => {
      host.card.set(buildRestrictedCard({ expansionName: undefined }));
      fixture.detectChanges();
      expandBody();

      const message = el.querySelector('.transformation-locked__message')!.textContent!;
      expect(message).not.toContain('undefined');
    });
  });
});
