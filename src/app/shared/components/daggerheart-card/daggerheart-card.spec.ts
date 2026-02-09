import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { DaggerheartCard } from './daggerheart-card';
import { CardData } from './daggerheart-card.model';

const MOCK_CARD: CardData = {
  id: 1,
  name: 'Bard',
  description: 'Masters of captivation.',
  cardType: 'class',
  subtitle: 'Codex · Grace',
  tags: ['Evasion 10', 'HP 5'],
};

const MOCK_CARD_WITH_FEATURES: CardData = {
  ...MOCK_CARD,
  features: [
    {
      name: 'Make a Scene',
      description: 'Spend 3 Hope to Distract a target.',
      subtitle: 'Hope Feature',
      tags: ['3 Hope'],
    },
    {
      name: 'Rally',
      description: 'Rally the party with a Rally Die.',
      subtitle: 'Class Feature',
      tags: ['1/Session'],
    },
  ],
};

@Component({
  imports: [DaggerheartCard],
  template: `
    <app-daggerheart-card
      [card]="card()"
      [selected]="selected()"
      (cardClicked)="onClicked($event)"
    />
  `,
})
class TestHost {
  card = signal<CardData>(MOCK_CARD);
  selected = signal(false);
  clickedCard: CardData | null = null;
  onClicked(card: CardData): void {
    this.clickedCard = card;
  }
}

describe('DaggerheartCard', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card).toBeTruthy();
  });

  it('should render the card name', () => {
    const name = fixture.nativeElement.querySelector('.card__name');
    expect(name.textContent.trim()).toBe('Bard');
  });

  it('should render the card description', () => {
    const desc = fixture.nativeElement.querySelector('.card__description');
    expect(desc.textContent.trim()).toBe('Masters of captivation.');
  });

  it('should render the subtitle when provided', () => {
    const subtitle = fixture.nativeElement.querySelector('.card__subtitle');
    expect(subtitle.textContent.trim()).toBe('Codex · Grace');
  });

  it('should render tags when provided', () => {
    const tags = fixture.nativeElement.querySelectorAll('.card__tag');
    expect(tags.length).toBe(2);
    expect(tags[0].textContent.trim()).toBe('Evasion 10');
    expect(tags[1].textContent.trim()).toBe('HP 5');
  });

  it('should not render tags section when no tags', () => {
    host.card.set({ ...MOCK_CARD, tags: undefined });
    fixture.detectChanges();

    const tagsContainer = fixture.nativeElement.querySelector('.card__tags');
    expect(tagsContainer).toBeFalsy();
  });

  it('should not render subtitle when not provided', () => {
    host.card.set({ ...MOCK_CARD, subtitle: undefined });
    fixture.detectChanges();

    const subtitle = fixture.nativeElement.querySelector('.card__subtitle');
    expect(subtitle).toBeFalsy();
  });

  it('should render the type badge', () => {
    const badge = fixture.nativeElement.querySelector('.card__type-badge');
    expect(badge.textContent.trim()).toBe('Class');
  });

  it('should apply the card type class', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card.classList.contains('card--type-class')).toBe(true);
  });

  it('should apply selected class when selected', () => {
    host.selected.set(true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    expect(card.classList.contains('card--selected')).toBe(true);
  });

  it('should not apply selected class when not selected', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card.classList.contains('card--selected')).toBe(false);
  });

  it('should emit cardClicked on click', () => {
    const card = fixture.nativeElement.querySelector('.card');
    card.click();

    expect(host.clickedCard).toEqual(MOCK_CARD);
  });

  it('should emit cardClicked on Enter key', () => {
    const card = fixture.nativeElement.querySelector('.card');
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(host.clickedCard).toEqual(MOCK_CARD);
  });

  it('should emit cardClicked on Space key', () => {
    const card = fixture.nativeElement.querySelector('.card');
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

    expect(host.clickedCard).toEqual(MOCK_CARD);
  });

  it('should not emit cardClicked on other keys', () => {
    const card = fixture.nativeElement.querySelector('.card');
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(host.clickedCard).toBeNull();
  });

  it('should have role="button"', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card.getAttribute('role')).toBe('button');
  });

  it('should have tabindex="0"', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card.getAttribute('tabindex')).toBe('0');
  });

  it('should have aria-label with card name and type', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card.getAttribute('aria-label')).toBe('Bard, Class card');
  });

  it('should have aria-pressed matching selected state', () => {
    const card = fixture.nativeElement.querySelector('.card');
    expect(card.getAttribute('aria-pressed')).toBe('false');

    host.selected.set(true);
    fixture.detectChanges();
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('should render correct type label for each card type', () => {
    const types = [
      { type: 'subclass' as const, label: 'Subclass' },
      { type: 'heritage' as const, label: 'Heritage' },
      { type: 'community' as const, label: 'Community' },
      { type: 'ancestry' as const, label: 'Ancestry' },
      { type: 'domain' as const, label: 'Domain' },
    ];

    for (const { type, label } of types) {
      host.card.set({ ...MOCK_CARD, cardType: type });
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.card__type-badge');
      expect(badge.textContent.trim()).toBe(label);
    }
  });

  describe('Collapsible Features', () => {
    it('should not render features section when no features', () => {
      const featuresSection = fixture.nativeElement.querySelector('.card__features');
      expect(featuresSection).toBeFalsy();
    });

    it('should not render features section when features is empty', () => {
      host.card.set({ ...MOCK_CARD, features: [] });
      fixture.detectChanges();

      const featuresSection = fixture.nativeElement.querySelector('.card__features');
      expect(featuresSection).toBeFalsy();
    });

    it('should render features toggle with correct count', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.card__features-toggle');
      expect(toggle).toBeTruthy();
      expect(toggle.textContent).toContain('2 Features');
    });

    it('should show singular "Feature" for single feature', () => {
      host.card.set({
        ...MOCK_CARD,
        features: [MOCK_CARD_WITH_FEATURES.features![0]],
      });
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.card__features-toggle');
      expect(toggle.textContent).toContain('1 Feature');
      expect(toggle.textContent).not.toContain('Features');
    });

    it('should start with features collapsed', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.card__features-list');
      expect(list.classList.contains('card__features-list--expanded')).toBe(false);
    });

    it('should expand features on toggle click', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.card__features-toggle');
      toggle.click();
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.card__features-list');
      expect(list.classList.contains('card__features-list--expanded')).toBe(true);
    });

    it('should collapse features on second toggle click', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.card__features-toggle');
      toggle.click();
      fixture.detectChanges();
      toggle.click();
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.card__features-list');
      expect(list.classList.contains('card__features-list--expanded')).toBe(false);
    });

    it('should render feature items with name and description', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.card__feature-item');
      expect(items.length).toBe(2);

      const firstName = items[0].querySelector('.card__feature-name');
      expect(firstName.textContent.trim()).toBe('Make a Scene');

      const firstDesc = items[0].querySelector('.card__feature-description');
      expect(firstDesc.textContent.trim()).toBe('Spend 3 Hope to Distract a target.');
    });

    it('should render feature subtitle when provided', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const subtitle = fixture.nativeElement.querySelector('.card__feature-subtitle');
      expect(subtitle.textContent.trim()).toBe('Hope Feature');
    });

    it('should render feature tags when provided', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const featureTags = fixture.nativeElement.querySelectorAll('.card__feature-tag');
      expect(featureTags.length).toBeGreaterThan(0);
      expect(featureTags[0].textContent.trim()).toBe('3 Hope');
    });

    it('should not propagate toggle click to card click', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.card__features-toggle');
      toggle.click();

      expect(host.clickedCard).toBeNull();
    });

    it('should have aria-expanded attribute on toggle', () => {
      host.card.set(MOCK_CARD_WITH_FEATURES);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.card__features-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });
  });
});
