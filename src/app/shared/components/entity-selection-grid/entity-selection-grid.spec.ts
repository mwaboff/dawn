import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntitySelectionGrid } from './entity-selection-grid';
import { CardData } from '../daggerheart-card/daggerheart-card.model';
import { EntityCardData, EntityCardSize } from '../entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../mappers/card-data-to-entity-card.mapper';

const MOCK_CARDS: CardData[] = [
  { id: 1, name: 'Warrior', description: 'Strong fighter', cardType: 'class' },
  { id: 2, name: 'Ranger', description: 'Skilled archer', cardType: 'class' },
  { id: 3, name: 'Wizard', description: 'Arcane caster', cardType: 'class' },
];

@Component({
  imports: [EntitySelectionGrid],
  template: `
    <app-entity-selection-grid
      [cards]="cards()"
      [loading]="loading()"
      [error]="error()"
      [selectedCard]="selectedCard()"
      [selectedCards]="selectedCards()"
      [maxSelections]="maxSelections()"
      [skeletonCount]="skeletonCount()"
      [layout]="layout()"
      [columns]="columns()"
      [size]="size()"
      [cardMapper]="cardMapper()"
      ariaLabel="Choose a class"
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
  layout = signal<'default' | 'wide'>('default');
  columns = signal<'auto' | 2>('auto');
  size = signal<EntityCardSize>('normal');
  cardMapper = signal<(card: CardData) => EntityCardData>(cardDataToEntityCard);
  lastSelectedCard: CardData | undefined;
  lastSelectedCards: CardData[] | undefined;

  onCardSelected(card: CardData): void {
    this.lastSelectedCard = card;
  }

  onCardsSelected(cards: CardData[]): void {
    this.lastSelectedCards = cards;
  }
}

describe('EntitySelectionGrid', () => {
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

  function controls(): NodeListOf<HTMLButtonElement> {
    return el.querySelectorAll<HTMLButtonElement>('.entity-select');
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-entity-selection-grid')).toBeTruthy();
  });

  it('should show skeleton when loading is true', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-entity-skeleton')).toBeTruthy();
    expect(el.querySelector('app-entity-card')).toBeFalsy();
    expect(el.querySelector('app-card-error')).toBeFalsy();
  });

  it('should show error component when error is true', () => {
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-card-error')).toBeTruthy();
    expect(el.querySelector('app-entity-skeleton')).toBeFalsy();
    expect(el.querySelector('app-entity-card')).toBeFalsy();
  });

  it('should show loading state over error state', () => {
    host.loading.set(true);
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-entity-skeleton')).toBeTruthy();
    expect(el.querySelector('app-card-error')).toBeFalsy();
  });

  it('should pass the current layout to the skeleton, so it occupies the same footprint the real cards will', () => {
    host.loading.set(true);
    host.layout.set('wide');
    fixture.detectChanges();

    const grid = el.querySelector('.entity-skeleton-grid');
    expect(grid?.classList.contains('entity-skeleton-grid--wide')).toBe(true);
  });

  it('should pass skeletonCount through to the skeleton', () => {
    host.loading.set(true);
    host.skeletonCount.set(4);
    fixture.detectChanges();

    expect(el.querySelectorAll('.entity-skeleton-card').length).toBe(4);
  });

  it('should render one EntityCard per card', () => {
    fixture.detectChanges();

    expect(el.querySelectorAll('app-entity-card').length).toBe(3);
  });

  it('should render an empty grid when cards is empty', () => {
    host.cards.set([]);
    fixture.detectChanges();

    expect(el.querySelector('.entity-selection-grid')).toBeTruthy();
    expect(el.querySelectorAll('app-entity-card').length).toBe(0);
  });

  it('should apply wide layout class', () => {
    host.layout.set('wide');
    fixture.detectChanges();

    expect(el.querySelector('.entity-selection-grid')?.classList.contains('entity-selection-grid--wide')).toBe(true);
  });

  describe('columns (2-column cap for text-dense cards)', () => {
    it('does not apply the columns-2 class by default (columns="auto")', () => {
      fixture.detectChanges();

      expect(el.querySelector('.entity-selection-grid')?.classList.contains('entity-selection-grid--columns-2')).toBe(false);
    });

    it('applies the columns-2 class when columns is 2', () => {
      host.columns.set(2);
      fixture.detectChanges();

      expect(el.querySelector('.entity-selection-grid')?.classList.contains('entity-selection-grid--columns-2')).toBe(true);
    });

    it('lets layout="wide" win over columns="2" -- an explicit single column beats a 2-column cap', () => {
      host.columns.set(2);
      host.layout.set('wide');
      fixture.detectChanges();

      const grid = el.querySelector('.entity-selection-grid');
      expect(grid?.classList.contains('entity-selection-grid--wide')).toBe(true);
      expect(grid?.classList.contains('entity-selection-grid--columns-2')).toBe(false);
    });

    it('passes columns through to the skeleton, so it caps at the same 2 columns while loading', () => {
      host.loading.set(true);
      host.columns.set(2);
      fixture.detectChanges();

      const grid = el.querySelector('.entity-skeleton-grid');
      expect(grid?.classList.contains('entity-skeleton-grid--columns-2')).toBe(true);
    });
  });

  describe('single-select (radiogroup)', () => {
    it('renders role="radiogroup" with the given aria-label', () => {
      fixture.detectChanges();

      const grid = el.querySelector('.entity-selection-grid');
      expect(grid?.getAttribute('role')).toBe('radiogroup');
      expect(grid?.getAttribute('aria-label')).toBe('Choose a class');
    });

    it('renders each control as role="radio" with aria-checked reflecting selection', () => {
      host.selectedCard.set(MOCK_CARDS[0]);
      fixture.detectChanges();

      const [first, second] = Array.from(controls());
      expect(first.getAttribute('role')).toBe('radio');
      expect(first.getAttribute('aria-checked')).toBe('true');
      expect(second.getAttribute('aria-checked')).toBe('false');
    });

    it('conveys selected state as text, not colour alone', () => {
      host.selectedCard.set(MOCK_CARDS[0]);
      fixture.detectChanges();

      const [first, second] = Array.from(controls());
      expect(first.textContent).toContain('Selected');
      expect(second.textContent).toContain('Select');
      expect(second.textContent).not.toContain('Selected');
    });

    it('emits cardSelected and cardsSelected on click', () => {
      fixture.detectChanges();

      controls()[0].click();
      fixture.detectChanges();

      expect(host.lastSelectedCard?.id).toBe(1);
      expect(host.lastSelectedCards).toEqual([MOCK_CARDS[0]]);
    });

    it('clears the selection when clicking the already-selected card', () => {
      host.selectedCard.set(MOCK_CARDS[0]);
      fixture.detectChanges();

      controls()[0].click();
      fixture.detectChanges();

      expect(host.lastSelectedCards).toEqual([]);
    });

    it('gives only the checked radio a tabindex of 0, others -1', () => {
      host.selectedCard.set(MOCK_CARDS[1]);
      fixture.detectChanges();

      const [first, second, third] = Array.from(controls());
      expect(first.getAttribute('tabindex')).toBe('-1');
      expect(second.getAttribute('tabindex')).toBe('0');
      expect(third.getAttribute('tabindex')).toBe('-1');
    });

    it('defaults tabindex 0 to the first radio when nothing is selected', () => {
      fixture.detectChanges();

      const [first, second] = Array.from(controls());
      expect(first.getAttribute('tabindex')).toBe('0');
      expect(second.getAttribute('tabindex')).toBe('-1');
    });

    it('moves selection and focus to the next radio on ArrowRight', () => {
      host.selectedCard.set(MOCK_CARDS[0]);
      fixture.detectChanges();

      controls()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(host.lastSelectedCards).toEqual([MOCK_CARDS[1]]);
      expect(document.activeElement).toBe(controls()[1]);
    });

    it('wraps to the last radio on ArrowLeft from the first', () => {
      host.selectedCard.set(MOCK_CARDS[0]);
      fixture.detectChanges();

      controls()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(host.lastSelectedCards).toEqual([MOCK_CARDS[2]]);
    });

    it('moves selection to the last radio on End', () => {
      host.selectedCard.set(MOCK_CARDS[0]);
      fixture.detectChanges();

      controls()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();

      expect(host.lastSelectedCards).toEqual([MOCK_CARDS[2]]);
    });
  });

  describe('multi-select (group of checkboxes)', () => {
    beforeEach(() => {
      host.maxSelections.set(2);
      fixture.detectChanges();
    });

    it('renders role="group" instead of radiogroup', () => {
      expect(el.querySelector('.entity-selection-grid')?.getAttribute('role')).toBe('group');
    });

    it('renders each control as role="checkbox"', () => {
      expect(controls()[0].getAttribute('role')).toBe('checkbox');
    });

    it('shows a live selection counter', () => {
      host.selectedCards.set([MOCK_CARDS[0]]);
      fixture.detectChanges();

      const counter = el.querySelector('.selection-counter');
      expect(counter?.textContent).toContain('1/2');
    });

    it('does not emit cardSelected in multi-select mode', () => {
      controls()[0].click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeUndefined();
    });

    it('adds a card to the selection when clicked under the cap', () => {
      host.selectedCards.set([MOCK_CARDS[0]]);
      fixture.detectChanges();

      controls()[1].click();
      fixture.detectChanges();

      expect(host.lastSelectedCards?.map(c => c.id)).toEqual([1, 2]);
    });

    it('removes a card from the selection when its checked control is clicked', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();

      controls()[0].click();
      fixture.detectChanges();

      expect(host.lastSelectedCards?.map(c => c.id)).toEqual([2]);
    });

    it('marks an unselected control aria-disabled once at the cap, without removing it from the tab order', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();

      const third = controls()[2];
      expect(third.getAttribute('aria-disabled')).toBe('true');
      expect(third.getAttribute('tabindex')).toBe('0');
    });

    it('does not emit when clicking an unselected control at the cap', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();
      host.lastSelectedCards = undefined;

      controls()[2].click();
      fixture.detectChanges();

      expect(host.lastSelectedCards).toBeUndefined();
    });

    it('conveys the at-max state as text, not colour alone', () => {
      host.selectedCards.set([MOCK_CARDS[0], MOCK_CARDS[1]]);
      fixture.detectChanges();

      expect(controls()[2].textContent).toContain('Limit reached');
    });

    it('does not apply roving tabindex to checkboxes -- every control stays tabbable', () => {
      host.selectedCards.set([MOCK_CARDS[0]]);
      fixture.detectChanges();

      for (const control of Array.from(controls())) {
        expect(control.getAttribute('tabindex')).toBe('0');
      }
    });
  });

  describe('size', () => {
    it('renders at normal size by default, unchanged from before this input existed', () => {
      fixture.detectChanges();

      expect(el.querySelector('.entity-card--compact')).toBeNull();
    });

    it('renders every card compact when size is set to compact', () => {
      host.size.set('compact');
      fixture.detectChanges();

      expect(el.querySelectorAll('.entity-card--compact').length).toBe(MOCK_CARDS.length);
    });
  });

  describe('cardMapper', () => {
    it('uses the generic cardDataToEntityCard by default', () => {
      fixture.detectChanges();

      expect(el.querySelector('app-entity-card')?.textContent).toContain('Warrior');
    });

    it('uses a caller-supplied mapper instead of the generic one when provided', () => {
      // `headline` only renders at `compact` size (entity-card.html) -- set both together so the
      // custom mapper's output is actually visible in the rendered DOM, not just in the model.
      host.size.set('compact');
      host.cardMapper.set(card => ({ ...cardDataToEntityCard(card), headline: 'Custom headline' }));
      fixture.detectChanges();

      expect(el.querySelector('app-entity-card')?.textContent).toContain('Custom headline');
    });
  });
});
