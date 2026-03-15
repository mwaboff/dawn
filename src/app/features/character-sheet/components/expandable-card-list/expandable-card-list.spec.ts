import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ExpandableCardList, CardType, AnyCardSummary } from './expandable-card-list';
import { DomainCardSummary, SubclassCardSummary } from '../../models/character-sheet-view.model';

@Component({
  template: `<app-expandable-card-list
    [heading]="heading()"
    [cards]="cards()"
    [cardType]="cardType()"
    [useGrid]="useGrid()"
    (toggleCard)="lastToggled = $event" />`,
  imports: [ExpandableCardList],
})
class TestHost {
  heading = signal('Ancestry');
  cards = signal<AnyCardSummary[]>([
    { id: 1, name: 'Elf', description: 'Ancient folk', features: [{ name: 'Darkvision', description: 'See in the dark', tags: ['Passive'] }] },
    { id: 2, name: 'Dwarf', features: [] },
  ]);
  cardType = signal<CardType>('ancestry');
  useGrid = signal(false);
  lastToggled: number | null = null;
}

describe('ExpandableCardList', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-expandable-card-list')).toBeTruthy();
  });

  it('displays the heading', () => {
    expect(el.querySelector('.card-group__heading')?.textContent?.trim()).toBe('Ancestry');
  });

  it('applies card type class to heading', () => {
    expect(el.querySelector('.card-group__heading--ancestry')).toBeTruthy();
  });

  it('renders all cards', () => {
    expect(el.querySelectorAll('.expandable-card').length).toBe(2);
  });

  it('applies card type class to cards', () => {
    expect(el.querySelectorAll('.expandable-card--ancestry').length).toBe(2);
  });

  it('displays card names', () => {
    const names = el.querySelectorAll('.expandable-card__name');
    expect(names[0].textContent?.trim()).toBe('Elf');
    expect(names[1].textContent?.trim()).toBe('Dwarf');
  });

  it('cards start collapsed', () => {
    expect(el.querySelector('.expandable-card__body')).toBeFalsy();
  });

  it('expands card on header click', () => {
    const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
    header.click();
    fixture.detectChanges();

    expect(el.querySelector('.expandable-card__body')).toBeTruthy();
  });

  it('emits toggleCard when header clicked', () => {
    const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
    header.click();
    fixture.detectChanges();

    expect(host.lastToggled).toBe(1);
  });

  it('collapses card on second click', () => {
    const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
    header.click();
    fixture.detectChanges();
    header.click();
    fixture.detectChanges();

    expect(el.querySelector('.expandable-card__body')).toBeFalsy();
  });

  it('shows description when card is expanded', () => {
    const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
    header.click();
    fixture.detectChanges();

    expect(el.querySelector('.card-description')?.textContent?.trim()).toBe('Ancient folk');
  });

  it('shows features when card is expanded', () => {
    const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
    header.click();
    fixture.detectChanges();

    expect(el.querySelector('.feature-row__name')?.textContent?.trim()).toBe('Darkvision');
  });

  it('shows feature tags when card is expanded', () => {
    const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
    header.click();
    fixture.detectChanges();

    expect(el.querySelector('.feature-tag')?.textContent?.trim()).toBe('Passive');
  });

  it('applies grid layout when useGrid is true', () => {
    host.useGrid.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.card-group__list--grid')).toBeTruthy();
  });

  it('does not apply grid layout when useGrid is false', () => {
    expect(el.querySelector('.card-group__list--grid')).toBeFalsy();
  });

  describe('subclass cards', () => {
    beforeEach(() => {
      const subclassCards: SubclassCardSummary[] = [
        {
          id: 10, name: 'Shadow Path', description: 'A dark path',
          associatedClassName: 'Rogue', subclassPathName: 'Shadow',
          domainNames: ['Midnight'], level: 'Foundation',
          features: [],
        },
      ];
      host.cards.set(subclassCards);
      host.cardType.set('subclass');
      host.heading.set('Subclass');
      fixture.detectChanges();
    });

    it('renders subclass card meta when expanded', () => {
      const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
      header.click();
      fixture.detectChanges();

      expect(el.querySelector('.card-meta')).toBeTruthy();
    });

    it('displays associated class name', () => {
      const header = el.querySelector<HTMLButtonElement>('.expandable-card__header')!;
      header.click();
      fixture.detectChanges();

      expect(el.querySelector('.card-meta')?.textContent).toContain('Rogue');
    });
  });

  describe('domain cards', () => {
    beforeEach(() => {
      const domainCards: DomainCardSummary[] = [
        {
          id: 20, name: 'Fireball', domainName: 'Arcana',
          level: 3, recallCost: 2, type: 'Spell',
          features: [{ name: 'Blast', description: 'Explodes', tags: [] }],
        },
      ];
      host.cards.set(domainCards);
      host.cardType.set('domain');
      host.heading.set('Domain Cards');
      fixture.detectChanges();
    });

    it('displays domain name in header meta', () => {
      expect(el.querySelector('.expandable-card__domain')?.textContent?.trim()).toBe('Arcana');
    });

    it('displays level badge in header meta', () => {
      const badges = el.querySelectorAll('.expandable-card__meta-badge');
      expect(badges[0].textContent?.trim()).toBe('Lvl 3');
    });

    it('displays type badge in header meta', () => {
      const badges = el.querySelectorAll('.expandable-card__meta-badge');
      expect(badges[1].textContent?.trim()).toBe('Spell');
    });

    it('displays recall cost badge in header meta', () => {
      const badges = el.querySelectorAll('.expandable-card__meta-badge');
      expect(badges[2].textContent?.trim()).toBe('Recall: 2');
    });
  });
});
