import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSelectionGrid } from './card-selection-grid';
import { CardData } from '../daggerheart-card/daggerheart-card.model';

const MOCK_CARDS: CardData[] = [
  { id: 1, name: 'Warrior', description: 'Strong fighter', cardType: 'class' },
  { id: 2, name: 'Ranger', description: 'Skilled archer', cardType: 'class' },
  { id: 3, name: 'Wizard', description: 'Arcane caster', cardType: 'class' },
];

@Component({
  imports: [CardSelectionGrid],
  template: `
    <app-card-selection-grid
      [cards]="cards()"
      [loading]="loading()"
      [error]="error()"
      [selectedCard]="selectedCard()"
      [selectedCards]="selectedCards()"
      [maxSelections]="maxSelections()"
      [skeletonCount]="skeletonCount()"
      [collapsibleFeatures]="collapsibleFeatures()"
      [layout]="layout()"
      (cardSelected)="onCardSelected($event)"
      (cardsSelected)="onCardsSelected($event)"
    />
  `,
})
class TestHost {
  cards = signal<CardData[]>(MOCK_CARDS);
  loading = signal(false);
  error = signal(false);
  selectedCard = signal<CardData | undefined>(undefined);
  selectedCards = signal<CardData[]>([]);
  maxSelections = signal(1);
  skeletonCount = signal(6);
  collapsibleFeatures = signal(false);
  layout = signal<'default' | 'wide'>('default');
  lastSelectedCard: CardData | undefined;
  lastSelectedCards: CardData[] | undefined;

  onCardSelected(card: CardData): void {
    this.lastSelectedCard = card;
  }

  onCardsSelected(cards: CardData[]): void {
    this.lastSelectedCards = cards;
  }
}

describe('CardSelectionGrid', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-card-selection-grid')).toBeTruthy();
  });

  it('should show skeleton when loading is true', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-card-skeleton')).toBeTruthy();
    expect(el.querySelector('app-daggerheart-card')).toBeFalsy();
    expect(el.querySelector('app-card-error')).toBeFalsy();
  });

  it('should show error component when error is true', () => {
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-card-error')).toBeTruthy();
    expect(el.querySelector('app-card-skeleton')).toBeFalsy();
    expect(el.querySelector('app-daggerheart-card')).toBeFalsy();
  });

  it('should show card grid when not loading and no error', () => {
    fixture.detectChanges();

    expect(el.querySelector('.card-grid')).toBeTruthy();
    expect(el.querySelector('app-card-skeleton')).toBeFalsy();
    expect(el.querySelector('app-card-error')).toBeFalsy();
  });

  it('should render correct number of cards', () => {
    fixture.detectChanges();

    const cards = el.querySelectorAll('app-daggerheart-card');
    expect(cards.length).toBe(3);
  });

  it('should use custom skeletonCount', () => {
    host.loading.set(true);
    host.skeletonCount.set(4);
    fixture.detectChanges();

    const skeleton = el.querySelector('app-card-skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('should emit cardSelected when a card is clicked in single-select mode', () => {
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    expect(host.lastSelectedCard).toBeTruthy();
    expect(host.lastSelectedCard?.id).toBe(1);
  });

  it('should also emit cardsSelected with [card] when clicking unselected card in single-select mode', () => {
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    expect(host.lastSelectedCards).toHaveLength(1);
    expect(host.lastSelectedCards?.[0].id).toBe(1);
  });

  it('should emit cardsSelected with [] when clicking already-selected card via selectedCard input', () => {
    host.selectedCard.set(MOCK_CARDS[0]);
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    expect(host.lastSelectedCards).toEqual([]);
  });

  it('should emit cardsSelected with [] when clicking already-selected card via selectedCards input (dynamic max=1)', () => {
    host.selectedCards.set([MOCK_CARDS[0]]);
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    expect(host.lastSelectedCards).toEqual([]);
  });

  it('should emit cardsSelected with [newCard] when replacing via different card in single-select mode', () => {
    host.selectedCards.set([MOCK_CARDS[0]]);
    fixture.detectChanges();

    const secondCard = el.querySelectorAll('app-daggerheart-card .card')[1] as HTMLElement;
    secondCard.click();
    fixture.detectChanges();

    expect(host.lastSelectedCards).toHaveLength(1);
    expect(host.lastSelectedCards?.[0].id).toBe(2);
  });

  it('should mark selected card in single-select mode', () => {
    host.selectedCard.set(MOCK_CARDS[0]);
    fixture.detectChanges();

    const firstCard = el.querySelector('app-daggerheart-card');
    expect(firstCard?.classList.contains('selected') || firstCard?.querySelector('.card--selected')).toBeTruthy();
  });

  it('should apply wide layout class', () => {
    host.layout.set('wide');
    fixture.detectChanges();

    const grid = el.querySelector('.card-grid');
    expect(grid?.classList.contains('card-grid--wide')).toBe(true);
  });

  it('should not apply wide layout class for default layout', () => {
    fixture.detectChanges();

    const grid = el.querySelector('.card-grid');
    expect(grid?.classList.contains('card-grid--wide')).toBe(false);
  });

  it('should show loading state over error state', () => {
    host.loading.set(true);
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-card-skeleton')).toBeTruthy();
    expect(el.querySelector('app-card-error')).toBeFalsy();
  });

  it('should render empty grid when cards array is empty', () => {
    host.cards.set([]);
    fixture.detectChanges();

    const grid = el.querySelector('.card-grid');
    expect(grid).toBeTruthy();
    expect(el.querySelectorAll('app-daggerheart-card').length).toBe(0);
  });

  describe('multi-select mode', () => {
    beforeEach(() => {
      host.maxSelections.set(2);
      fixture.detectChanges();
    });

    it('should show selection counter when maxSelections > 1', () => {
      const counter = el.querySelector('.selection-counter');
      expect(counter).toBeTruthy();
    });

    it('should not show selection counter in single-select mode', () => {
      host.maxSelections.set(1);
      fixture.detectChanges();

      expect(el.querySelector('.selection-counter')).toBeFalsy();
    });

    it('should display current selection count', () => {
      host.selectedCards.set([MOCK_CARDS[0]]);
      fixture.detectChanges();

      const counter = el.querySelector('.selection-counter');
      expect(counter?.textContent).toContain('1/2');
    });

    it('should emit cardsSelected with card added when clicking unselected card under max', () => {
      host.selectedCards.set([MOCK_CARDS[0]]);
      fixture.detectChanges();

      const secondCard = el.querySelectorAll('app-daggerheart-card .card')[1] as HTMLElement;
      secondCard.click();
      fixture.detectChanges();

      expect(host.lastSelectedCards).toHaveLength(2);
      expect(host.lastSelectedCards?.map(c => c.id)).toContain(1);
      expect(host.lastSelectedCards?.map(c => c.id)).toContain(2);
    });

    it('should emit cardsSelected with card removed when clicking already-selected card', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();

      const firstCard = el.querySelector('app-daggerheart-card .card') as HTMLElement;
      firstCard.click();
      fixture.detectChanges();

      expect(host.lastSelectedCards).toHaveLength(1);
      expect(host.lastSelectedCards?.[0].id).toBe(2);
    });

    it('should not emit when at max selections and clicking unselected card', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();

      host.lastSelectedCards = undefined;
      const thirdCard = el.querySelectorAll('app-daggerheart-card .card')[2] as HTMLElement;
      thirdCard.click();
      fixture.detectChanges();

      expect(host.lastSelectedCards).toBeUndefined();
    });

    it('should mark all selected cards using selectedCards input', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();

      const allCards = el.querySelectorAll('app-daggerheart-card');
      const firstSelected = allCards[0]?.querySelector('.card--selected');
      const secondSelected = allCards[1]?.querySelector('.card--selected');
      const thirdSelected = allCards[2]?.querySelector('.card--selected');

      expect(firstSelected).toBeTruthy();
      expect(secondSelected).toBeTruthy();
      expect(thirdSelected).toBeFalsy();
    });

    it('should not emit cardSelected in multi-select mode', () => {
      fixture.detectChanges();

      const firstCard = el.querySelector('app-daggerheart-card .card') as HTMLElement;
      firstCard.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeUndefined();
    });
  });
});
