import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubclassPathSelector } from './subclass-path-selector';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildSubclassCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 100,
    name: 'Troubadour',
    description: 'Musical warrior',
    cardType: 'subclass',
    metadata: { subclassPathId: 10, level: 'FOUNDATION' },
    ...overrides,
  };
}

const MOCK_SUBCLASS_CARDS: CardData[] = [
  buildSubclassCard({ id: 100, name: 'Troubadour', metadata: { subclassPathId: 10, level: 'FOUNDATION' } }),
  buildSubclassCard({ id: 101, name: 'Troubadour Spec', metadata: { subclassPathId: 10, level: 'SPECIALIZATION' } }),
  buildSubclassCard({ id: 102, name: 'Troubadour Master', metadata: { subclassPathId: 10, level: 'MASTERY' } }),
  buildSubclassCard({ id: 200, name: 'Wordsmith', metadata: { subclassPathId: 20, level: 'FOUNDATION' } }),
  buildSubclassCard({ id: 201, name: 'Wordsmith Spec', metadata: { subclassPathId: 20, level: 'SPECIALIZATION' } }),
  buildSubclassCard({ id: 202, name: 'Wordsmith Master', metadata: { subclassPathId: 20, level: 'MASTERY' } }),
];

@Component({
  template: `<app-subclass-path-selector
    [cards]="cards()"
    [selectedCard]="selectedCard()"
    (cardSelected)="onCardSelected($event)"
  />`,
  imports: [SubclassPathSelector],
})
class TestHost {
  cards = signal<CardData[]>([]);
  selectedCard = signal<CardData | undefined>(undefined);
  lastSelectedCard: CardData | undefined;

  onCardSelected(card: CardData): void {
    this.lastSelectedCard = card;
  }
}

describe('SubclassPathSelector', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();
    const selector = fixture.nativeElement.querySelector('app-subclass-path-selector');
    expect(selector).toBeTruthy();
  });

  it('should group cards by subclassPathId into paths', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const paths = compiled.querySelectorAll('.tabbed-path');
    expect(paths.length).toBe(2);
  });

  it('should render Foundation/Specialization/Mastery tabs for each path', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabLists = compiled.querySelectorAll('.tabbed-path__tabs');
    expect(tabLists.length).toBe(2);

    const firstPathTabs = tabLists[0].querySelectorAll('.tabbed-path__tab');
    expect(firstPathTabs.length).toBe(3);
    expect(firstPathTabs[0].textContent).toContain('Foundation');
    expect(firstPathTabs[1].textContent).toContain('Specialization');
    expect(firstPathTabs[2].textContent).toContain('Mastery');
  });

  it('should default to Foundation level tab', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const activeTab = compiled.querySelector('.tabbed-path__tab--active');
    expect(activeTab?.textContent).toContain('Foundation');
  });

  it('should switch level tab when clicked', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('.tabbed-path__tab');
    const specTab = tabs[1] as HTMLButtonElement;
    specTab.click();
    fixture.detectChanges();

    expect(specTab.classList.contains('tabbed-path__tab--active')).toBe(true);
  });

  it('should show correct card for selected level', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    let card = compiled.querySelector('app-daggerheart-card');
    expect(card).toBeTruthy();

    const tabs = compiled.querySelectorAll('.tabbed-path__tab');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    card = compiled.querySelector('app-daggerheart-card');
    expect(card).toBeTruthy();
  });

  it('should emit cardSelected with foundation card when card is clicked', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardInner.click();
    fixture.detectChanges();

    expect(host.lastSelectedCard).toBeTruthy();
    expect(host.lastSelectedCard?.id).toBe(100);
  });

  it('should show selected state when selectedCard matches foundation', () => {
    const foundationCard = MOCK_SUBCLASS_CARDS[0];
    host.cards.set(MOCK_SUBCLASS_CARDS);
    host.selectedCard.set(foundationCard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cardEl = compiled.querySelector('app-daggerheart-card');
    expect(cardEl).toBeTruthy();
  });

  it('should handle paths with only Foundation level', () => {
    const foundationOnly: CardData[] = [
      buildSubclassCard({ id: 300, name: 'Solo Path', metadata: { subclassPathId: 30, level: 'FOUNDATION' } }),
    ];
    host.cards.set(foundationOnly);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const paths = compiled.querySelectorAll('.tabbed-path');
    expect(paths.length).toBe(1);

    const tabs = paths[0].querySelectorAll('.tabbed-path__tab');
    expect(tabs.length).toBe(1);
    expect(tabs[0].textContent).toContain('Foundation');
  });

  it('should render aria attributes on tabbed paths', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const path = compiled.querySelector('.tabbed-path');
    expect(path?.getAttribute('aria-label')).toContain('subclass path');

    const tablist = compiled.querySelector('.tabbed-path__tabs');
    expect(tablist?.getAttribute('role')).toBe('tablist');

    const tab = compiled.querySelector('.tabbed-path__tab');
    expect(tab?.getAttribute('role')).toBe('tab');
    expect(tab?.getAttribute('aria-selected')).toBe('true');
  });
});
