import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MartialStanceSelector } from './martial-stance-selector';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

function makeStance(id: number, tier: number, name = `Stance ${id}`): CardData {
  return {
    id,
    name,
    description: 'A martial stance.',
    cardType: 'martialStance',
    metadata: { tier },
  };
}

const TIER1 = [makeStance(1, 1, 'Aggressive'), makeStance(2, 1, 'Defensive'), makeStance(3, 1, 'Evasive'), makeStance(4, 1, 'Balanced')];
const TIER2 = [makeStance(5, 2, 'Relentless')];
const ALL_STANCES = [...TIER1, ...TIER2];

describe('MartialStanceSelector', () => {
  let fixture: ComponentFixture<MartialStanceSelector>;
  let component: MartialStanceSelector;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MartialStanceSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(MartialStanceSelector);
    component = fixture.componentInstance;
  });

  function setCards(cards: CardData[] = ALL_STANCES, selected: CardData[] = []): void {
    fixture.componentRef.setInput('cards', cards);
    fixture.componentRef.setInput('selectedCards', selected);
    fixture.detectChanges();
  }

  it('creates', () => {
    setCards();
    expect(component).toBeTruthy();
  });

  it('shows a skeleton while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-card-skeleton')).toBeTruthy();
  });

  it('shows an error state on failure', () => {
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-card-error')).toBeTruthy();
  });

  it('displays the "0 of 2 chosen" counter initially', () => {
    setCards();
    const counter = fixture.nativeElement.querySelector('.selection-counter');
    expect(counter.textContent.trim()).toBe('0 of 2 chosen');
  });

  it('groups stances by tier with a heading per tier', () => {
    setCards();
    const headings = Array.from(fixture.nativeElement.querySelectorAll('.stance-tier-group__heading')) as HTMLElement[];
    expect(headings.map(h => h.textContent?.trim())).toEqual(['Tier 1', 'Tier 2']);
  });

  it('marks tier 2+ groups with an unlock hint', () => {
    setCards();
    expect(fixture.nativeElement.querySelector('.stance-tier-group__hint')).toBeTruthy();
  });

  it('selects a tier 1 stance on click', () => {
    setCards();
    let emitted: CardData[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER1[0]);

    expect(emitted).toEqual([TIER1[0]]);
  });

  it('deselects an already-selected tier 1 stance', () => {
    setCards(ALL_STANCES, [TIER1[0]]);
    let emitted: CardData[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER1[0]);

    expect(emitted).toEqual([]);
  });

  it('does not select a tier 2 stance -- rules bug guard', () => {
    setCards();
    let emitted: CardData[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER2[0]);

    expect(emitted).toBeUndefined();
  });

  it('renders tier 2+ cards as disabled', () => {
    setCards();
    const cards = Array.from(fixture.nativeElement.querySelectorAll('app-daggerheart-card')) as HTMLElement[];
    const tier2Card = cards.find(el => el.textContent?.includes('Relentless'));
    expect(tier2Card?.querySelector('.card')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('blocks a 3rd selection once 2 tier 1 stances are chosen', () => {
    setCards(ALL_STANCES, [TIER1[0], TIER1[1]]);
    let emitted: CardData[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER1[2]);

    expect(emitted).toBeUndefined();
  });

  it('reports the correct selection count with 2 chosen', () => {
    setCards(ALL_STANCES, [TIER1[0], TIER1[1]]);
    const counter = fixture.nativeElement.querySelector('.selection-counter');
    expect(counter.textContent.trim()).toBe('2 of 2 chosen');
  });
});
