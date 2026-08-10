import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubclassPathSelector } from './subclass-path-selector';
import { CardData } from '../daggerheart-card/daggerheart-card.model';

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
    [collapsibleFeatures]="collapsibleFeatures()"
    [ownedCardIds]="ownedCardIds()"
    [foundationOnly]="foundationOnly()"
    [cardFormat]="cardFormat()"
    [readOnly]="readOnly()"
    (cardSelected)="onCardSelected($event)"
  />`,
  imports: [SubclassPathSelector],
})
class TestHost {
  cards = signal<CardData[]>([]);
  selectedCard = signal<CardData | undefined>(undefined);
  collapsibleFeatures = signal(false);
  ownedCardIds = signal<number[]>([]);
  foundationOnly = signal(false);
  cardFormat = signal<'classic' | 'beta'>('classic');
  readOnly = signal(false);
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

  it('should pass collapsibleFeatures to DaggerheartCard', () => {
    host.cards.set(MOCK_SUBCLASS_CARDS);
    host.collapsibleFeatures.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('app-daggerheart-card');
    expect(card).toBeTruthy();
  });

  describe('foundationOnly mode', () => {
    beforeEach(() => {
      host.cards.set(MOCK_SUBCLASS_CARDS);
      host.foundationOnly.set(true);
      fixture.detectChanges();
    });

    it('should mark Specialization and Mastery tabs as locked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      expect(firstPathTabs[0].classList.contains('tabbed-path__tab--locked')).toBe(false);
      expect(firstPathTabs[1].classList.contains('tabbed-path__tab--locked')).toBe(true);
      expect(firstPathTabs[2].classList.contains('tabbed-path__tab--locked')).toBe(true);
    });

    it('should show Foundation card in normal state', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const wrapper = compiled.querySelector('.card-state-wrapper');
      expect(wrapper?.classList.contains('card-state--locked')).toBe(false);
      expect(wrapper?.classList.contains('card-state--owned')).toBe(false);
    });

    it('should show locked state when viewing Specialization card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabs = compiled.querySelectorAll('.tabbed-path__tab');
      (tabs[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      const wrapper = compiled.querySelector('.card-state--locked');
      expect(wrapper).toBeTruthy();
    });

    it('should emit cardSelected with foundation card when foundation is clicked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeTruthy();
      expect(host.lastSelectedCard?.id).toBe(100);
    });

    it('should not emit when clicking a locked Specialization card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabs = compiled.querySelectorAll('.tabbed-path__tab');
      (tabs[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeUndefined();
    });

    it('should not emit when clicking a locked Mastery card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabs = compiled.querySelectorAll('.tabbed-path__tab');
      (tabs[2] as HTMLButtonElement).click();
      fixture.detectChanges();

      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeUndefined();
    });
  });

  describe('upgrade mode (ownedCardIds provided)', () => {
    beforeEach(() => {
      host.cards.set(MOCK_SUBCLASS_CARDS);
      host.ownedCardIds.set([100, 200]);
      fixture.detectChanges();
    });

    it('should default to the next upgrade tab instead of Foundation', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const activeTab = compiled.querySelector('.tabbed-path__tab--active');
      expect(activeTab?.textContent).toContain('Specialization');
    });

    it('should apply owned class to tabs with owned cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      expect(firstPathTabs[0].classList.contains('tabbed-path__tab--owned')).toBe(true);
    });

    it('should apply next class to tabs with next upgrade cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      expect(firstPathTabs[1].classList.contains('tabbed-path__tab--next')).toBe(true);
    });

    it('should apply locked class to tabs beyond the next upgrade', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      expect(firstPathTabs[2].classList.contains('tabbed-path__tab--locked')).toBe(true);
    });

    it('should show owned badge on owned tabs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('.tab-badge--owned');
      expect(badge).toBeTruthy();
    });

    it('should show card-state--owned wrapper for owned cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      (firstPathTabs[0] as HTMLButtonElement).click();
      fixture.detectChanges();

      const wrapper = compiled.querySelector('.card-state--owned');
      expect(wrapper).toBeTruthy();
    });

    it('should show Owned badge on owned card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      (firstPathTabs[0] as HTMLButtonElement).click();
      fixture.detectChanges();

      const badge = compiled.querySelector('.card-state-badge--owned');
      expect(badge?.textContent).toContain('Owned');
    });

    it('should emit the next upgrade card when clicked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeTruthy();
      expect(host.lastSelectedCard?.id).toBe(101);
    });

    it('should not emit when clicking an owned card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      (firstPathTabs[0] as HTMLButtonElement).click();
      fixture.detectChanges();

      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeUndefined();
    });

    it('should not emit when clicking a locked card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      (firstPathTabs[2] as HTMLButtonElement).click();
      fixture.detectChanges();

      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard).toBeUndefined();
    });

    it('should show card-state--locked wrapper for locked cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
      (firstPathTabs[2] as HTMLButtonElement).click();
      fixture.detectChanges();

      const wrapper = compiled.querySelector('.card-state--locked');
      expect(wrapper).toBeTruthy();
    });

    it('should allow tabs to still be clickable for browsing', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');

      (firstPathTabs[2] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(firstPathTabs[2].classList.contains('tabbed-path__tab--active')).toBe(true);
      const card = compiled.querySelector('app-daggerheart-card');
      expect(card).toBeTruthy();
    });
  });

  describe('beta mode (cardFormat="beta")', () => {
    beforeEach(() => {
      host.cardFormat.set('beta');
    });

    it('renders EntityCard instead of DaggerheartCard', () => {
      host.cards.set(MOCK_SUBCLASS_CARDS);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-entity-card')).toBeTruthy();
      expect(compiled.querySelector('app-daggerheart-card')).toBeFalsy();
    });

    it('renders a Select control that emits the foundation card when clicked', () => {
      host.cards.set(MOCK_SUBCLASS_CARDS);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const select = compiled.querySelector('app-entity-card .entity-select') as HTMLButtonElement;
      expect(select).toBeTruthy();
      expect(select.textContent).toContain('Select');

      select.click();
      fixture.detectChanges();

      expect(host.lastSelectedCard?.id).toBe(100);
    });

    it('reflects the current selection as text and aria-pressed, not colour alone', () => {
      host.cards.set(MOCK_SUBCLASS_CARDS);
      host.selectedCard.set(MOCK_SUBCLASS_CARDS[0]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const select = compiled.querySelector('app-entity-card .entity-select') as HTMLButtonElement;
      expect(select.getAttribute('aria-pressed')).toBe('true');
      expect(select.textContent).toContain('Selected');
    });

    describe('readOnly (defaults false, does not affect selection surfaces)', () => {
      it('defaults to false -- the Select control still renders untouched', () => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('app-entity-card .entity-select')).toBeTruthy();
      });

      it('suppresses the Select control in a plain browse context (no ownedCardIds, no foundationOnly)', () => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.readOnly.set(true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('app-entity-card .entity-select')).toBeFalsy();
      });

      it('leaves nothing focusable and no empty [card-controls] box when there is nothing to show', () => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.readOnly.set(true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('[card-controls]')).toBeFalsy();
        expect(card?.querySelector('.card-action-row')).toBeFalsy();
        expect(card?.querySelectorAll('button').length).toBe(0);
      });

      it('still shows Owned status text once ownedCardIds is actually passed', () => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.ownedCardIds.set([100, 200]);
        host.readOnly.set(true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
        (firstPathTabs[0] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('.entity-select')).toBeFalsy();
        expect(card?.querySelector('.card-select-status')?.textContent).toContain('Owned');
      });

      it('still shows Locked status text once ownedCardIds is actually passed, with no Select control', () => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.ownedCardIds.set([100, 200]);
        host.readOnly.set(true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
        (firstPathTabs[2] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('.entity-select')).toBeFalsy();
        expect(card?.querySelector('.card-select-status')?.textContent).toContain('Locked');
      });

      it('suppresses Locked status text for foundationOnly-only locking with no ownedCardIds', () => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.foundationOnly.set(true);
        host.readOnly.set(true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const tabs = compiled.querySelectorAll('.tabbed-path__tab');
        (tabs[1] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('.card-select-status')).toBeFalsy();
        expect(card?.querySelector('.entity-select')).toBeFalsy();
        // EntityCard's own muted dimming still marks it, even with no status text.
        expect(card?.classList.contains('entity-card--muted')).toBe(true);
      });

      it('has no effect on the classic path -- the DaggerheartCard stays clickable', () => {
        host.cardFormat.set('classic');
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.readOnly.set(true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
        cardInner.click();
        fixture.detectChanges();

        expect(host.lastSelectedCard?.id).toBe(100);
      });
    });

    describe('foundationOnly mode', () => {
      beforeEach(() => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.foundationOnly.set(true);
        fixture.detectChanges();
      });

      it('shows a Locked status with no Select control for a locked Specialization card', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const tabs = compiled.querySelectorAll('.tabbed-path__tab');
        (tabs[1] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('.entity-select')).toBeFalsy();
        expect(card?.querySelector('.card-select-status')?.textContent).toContain('Locked');
        expect(card?.getAttribute('data-card-type')).toBeTruthy();
      });

      it('mutes the locked card', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const tabs = compiled.querySelectorAll('.tabbed-path__tab');
        (tabs[1] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.classList.contains('entity-card--muted')).toBe(true);
      });
    });

    describe('upgrade mode (ownedCardIds provided)', () => {
      beforeEach(() => {
        host.cards.set(MOCK_SUBCLASS_CARDS);
        host.ownedCardIds.set([100, 200]);
        fixture.detectChanges();
      });

      it('shows an Owned status with no Select control for an owned Foundation card', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
        (firstPathTabs[0] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('.entity-select')).toBeFalsy();
        expect(card?.querySelector('.card-select-status')?.textContent).toContain('Owned');
      });

      it('emits the next upgrade card when its Select control is clicked', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const select = compiled.querySelector('app-entity-card .entity-select') as HTMLButtonElement;
        select.click();
        fixture.detectChanges();

        expect(host.lastSelectedCard?.id).toBe(101);
      });

      it('shows a Locked status with no Select control beyond the next upgrade', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const firstPathTabs = compiled.querySelectorAll('.tabbed-path__tabs')[0].querySelectorAll('.tabbed-path__tab');
        (firstPathTabs[2] as HTMLButtonElement).click();
        fixture.detectChanges();

        const card = compiled.querySelector('app-entity-card');
        expect(card?.querySelector('.entity-select')).toBeFalsy();
        expect(card?.querySelector('.card-select-status')?.textContent).toContain('Locked');
      });
    });
  });
});
