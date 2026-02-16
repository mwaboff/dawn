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
      [skeletonCount]="skeletonCount()"
      [collapsibleFeatures]="collapsibleFeatures()"
      [layout]="layout()"
      (cardSelected)="onCardSelected($event)"
    />
  `,
})
class TestHost {
  cards = signal<CardData[]>(MOCK_CARDS);
  loading = signal(false);
  error = signal(false);
  selectedCard = signal<CardData | undefined>(undefined);
  skeletonCount = signal(6);
  collapsibleFeatures = signal(false);
  layout = signal<'default' | 'wide'>('default');
  lastSelectedCard: CardData | undefined;

  onCardSelected(card: CardData): void {
    this.lastSelectedCard = card;
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

  it('should emit cardSelected when a card is clicked', () => {
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    expect(host.lastSelectedCard).toBeTruthy();
    expect(host.lastSelectedCard?.id).toBe(1);
  });

  it('should mark selected card', () => {
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
});
