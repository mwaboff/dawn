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

@Component({
  template: `
    <app-transformation-panel
      [card]="card()"
      [tokens]="tokens()"
      [wolfFormActive]="wolfFormActive()"
      [canAct]="canAct()"
      (tokensChange)="lastTokens = $event"
      (wolfFormToggle)="lastWolfForm = $event"
    />
  `,
  imports: [TransformationPanel],
})
class TestHost {
  card = signal<TransformationCardResponse>(buildCard());
  tokens = signal<number | null>(null);
  wolfFormActive = signal(false);
  canAct = signal(true);
  lastTokens: number | null = null;
  lastWolfForm: boolean | null = null;
}

describe('TransformationPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

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

  it('renders the card name', () => {
    expect(el.querySelector('.transformation-name')?.textContent).toContain('Demigod');
  });

  it('renders both features', () => {
    expect(el.querySelectorAll('.transformation-feature').length).toBe(2);
  });

  it('renders all six... rather all provided questions', () => {
    expect(el.querySelectorAll('.transformation-questions__list li').length).toBe(2);
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
});
