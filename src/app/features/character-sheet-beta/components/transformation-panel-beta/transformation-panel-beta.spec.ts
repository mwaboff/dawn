import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { TransformationPanelBeta } from './transformation-panel-beta';
import { TransformationPanel } from '../../../character-sheet/components/transformation-panel/transformation-panel';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
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
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

const CATALOG: TransformationCardResponse[] = [buildCard(), buildCard({ id: 2, name: 'Vampire' })];

@Component({
  template: `
    <app-transformation-panel-beta
      [card]="card()"
      [catalog]="catalog()"
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
  imports: [TransformationPanelBeta],
})
class TestHost {
  card = signal<TransformationCardResponse | null>(buildCard());
  catalog = signal<TransformationCardResponse[]>(CATALOG);
  isOwner = signal(true);
  tokens = signal<number | null>(null);
  wolfFormActive = signal(false);
  canAct = signal(true);
  lastTokens: number | null = null;
  lastWolfForm: boolean | null = null;
  lastSelected: number | null = null;
  removedCalled = false;
}

describe('TransformationPanelBeta', () => {
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

  it('extends the classic panel, inheriting its transformation logic', () => {
    const panel = fixture.debugElement.query(By.directive(TransformationPanelBeta));
    expect(panel.componentInstance).toBeInstanceOf(TransformationPanel);
  });

  it('renders one EntityCard for the attached transformation, mapped from the card data', () => {
    const cards = fixture.debugElement.queryAll(By.directive(EntityCard));
    expect(cards.length).toBe(1);

    const data = cards[0].componentInstance.card();
    expect(data.id).toBe(1);
    expect(data.name).toBe('Demigod');
    expect(data.cardType).toBe('transformationCard');
    expect(data.description).toBe('A divine burden.');
    expect(data.features).toEqual([
      { name: 'Divine Blessing', description: 'You are blessed.' },
      { name: 'Heavy Burden', description: 'It costs you.' },
    ]);
  });

  it('adds a Feed badge for a Vampire card, tracking the current token count', () => {
    host.card.set(buildCard({ name: 'Vampire' }));
    host.tokens.set(3);
    fixture.detectChanges();

    const data = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();
    expect(data.badges).toEqual([{ label: 'Feed', value: '3/6' }]);
  });

  it('adds a Human/Wolf form badge for a Werewolf card', () => {
    host.card.set(buildCard({ name: 'Werewolf' }));
    fixture.detectChanges();

    const data = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();
    expect(data.badges).toEqual([{ label: 'Human form' }]);
  });

  it('renders no EntityCard and shows the empty state when nothing is attached', () => {
    host.card.set(null);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(EntityCard))).toBeFalsy();
    expect(el.querySelector('.transformation-empty')).toBeTruthy();
  });

  it('projects the Feed-token stepper into card-controls, wired to the inherited handler', () => {
    host.card.set(buildCard({ name: 'Vampire' }));
    host.tokens.set(3);
    fixture.detectChanges();

    const addBtn = el.querySelectorAll<HTMLButtonElement>('[card-controls] .feed-tokens__btn')[1];
    expect(addBtn.closest('.entity-card__controls')).toBeTruthy();

    addBtn.click();

    expect(host.lastTokens).toBe(4);
  });

  it('projects the Wolf Form toggle into card-controls, wired to the inherited handler', () => {
    host.card.set(buildCard({ name: 'Werewolf' }));
    fixture.detectChanges();

    const toggle = el.querySelector<HTMLButtonElement>('[card-controls].wolf-form-toggle');
    expect(toggle?.closest('.entity-card__controls')).toBeTruthy();

    toggle?.click();

    expect(host.lastWolfForm).toBe(true);
  });

  it('projects Change and Remove into card-actions for an owner, wired to the inherited handlers', () => {
    const buttons = el.querySelectorAll<HTMLButtonElement>('[card-actions] button');
    expect(Array.from(buttons).map(b => b.textContent?.trim())).toEqual(['Change', 'Remove']);
    expect(buttons[0].closest('.entity-card__actions')).toBeTruthy();

    buttons[1].click();
    expect(host.removedCalled).toBe(true);
  });

  it('hides card-actions for a non-owner', () => {
    host.isOwner.set(false);
    fixture.detectChanges();

    expect(el.querySelector('[card-actions]')).toBeFalsy();
  });

  it('renders the picker outside the EntityCard once opened', () => {
    const changeBtn = el.querySelectorAll<HTMLButtonElement>('[card-actions] button')[0];
    changeBtn.click();
    fixture.detectChanges();

    const cardEl = fixture.debugElement.query(By.directive(EntityCard)).nativeElement as HTMLElement;
    const picker = el.querySelector('.transformation-picker');

    expect(picker).toBeTruthy();
    expect(cardEl.contains(picker)).toBe(false);
    expect(el.querySelectorAll('app-daggerheart-card').length).toBe(CATALOG.length);
  });

  it('emits the selected card id from the picker', () => {
    const changeBtn = el.querySelectorAll<HTMLButtonElement>('[card-actions] button')[0];
    changeBtn.click();
    fixture.detectChanges();

    el.querySelectorAll<HTMLElement>('.transformation-picker app-daggerheart-card .card')[1].click();
    fixture.detectChanges();

    expect(host.lastSelected).toBe(CATALOG[1].id);
  });
});
