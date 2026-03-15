import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';

import { DomainTradeStep } from './domain-trade-step';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { DomainCardTradeRequest } from '../../models/level-up-api.model';
import { DomainCardSummary } from '../../../character-sheet/models/character-sheet-view.model';

const MOCK_CHARACTER_CARDS: DomainCardSummary[] = [
  { id: 1, name: 'Flame Strike', features: [], domainName: 'Arcana', level: 1 },
  { id: 2, name: 'Ice Shield', features: [], domainName: 'Arcana', level: 2 },
  { id: 3, name: 'Healing Light', features: [], domainName: 'Grace', level: 1 },
];

const MOCK_TRADABLE_CARDS: CardData[] = [
  { id: 50, name: 'Lightning Bolt', description: 'Zap', cardType: 'domain' },
  { id: 51, name: 'Stone Wall', description: 'Block', cardType: 'domain' },
];

const mockDomainService = {
  getDomainCards: vi.fn().mockReturnValue(of(MOCK_TRADABLE_CARDS)),
};

@Component({
  template: `
    <app-domain-trade-step
      [characterDomainCards]="characterDomainCards()"
      [accessibleDomainIds]="accessibleDomainIds()"
      [domainCardLevelCap]="domainCardLevelCap()"
      [newDomainCard]="newDomainCard()"
      [initialTrades]="initialTrades()"
      (tradesChanged)="onTradesChanged($event)"
    />
  `,
  imports: [DomainTradeStep],
})
class TestHost {
  characterDomainCards = signal<DomainCardSummary[]>(MOCK_CHARACTER_CARDS);
  accessibleDomainIds = signal<number[]>([1, 2]);
  domainCardLevelCap = signal<number | null>(3);
  newDomainCard = signal<CardData | undefined>(undefined);
  initialTrades = signal<DomainCardTradeRequest[]>([]);

  lastTrades: DomainCardTradeRequest[] | undefined;

  onTradesChanged(trades: DomainCardTradeRequest[]): void {
    this.lastTrades = trades;
  }
}

describe('DomainTradeStep', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    mockDomainService.getDomainCards.mockClear();
    mockDomainService.getDomainCards.mockReturnValue(of(MOCK_TRADABLE_CARDS));

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        { provide: DomainService, useValue: mockDomainService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(el.querySelector('app-domain-trade-step')).toBeTruthy();
  });

  it('should render step instruction', () => {
    const instruction = el.querySelector('.step-instruction');
    expect(instruction?.textContent).toContain('Optionally trade domain cards');
  });

  it('should emit empty trades on skip', () => {
    const skipBtn = el.querySelector('.trade-btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();

    expect(host.lastTrades).toEqual([]);
  });

  it('should show skip message after clicking skip', () => {
    const skipBtn = el.querySelector('.trade-btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();

    const msg = el.querySelector('.skip-message');
    expect(msg?.textContent).toContain('No trades will be made');
  });

  it('should add a trade row when clicking add trade', () => {
    const addBtn = el.querySelector('.trade-btn--add') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const rows = el.querySelectorAll('.trade-row');
    expect(rows.length).toBe(1);
  });

  it('should remove a trade row', () => {
    const addBtn = el.querySelector('.trade-btn--add') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const removeBtn = el.querySelector('.trade-row__remove') as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();

    const rows = el.querySelectorAll('.trade-row');
    expect(rows.length).toBe(0);
  });

  it('should render character domain cards as trade-out buttons in trade row', () => {
    const addBtn = el.querySelector('.trade-btn--add') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const tradeOutBtns = el.querySelectorAll('.trade-card-btn');
    expect(tradeOutBtns.length).toBe(3);
  });

  it('should toggle trade-out card selection', () => {
    const addBtn = el.querySelector('.trade-btn--add') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const tradeOutBtn = el.querySelector('.trade-card-btn') as HTMLButtonElement;
    tradeOutBtn.click();
    fixture.detectChanges();

    expect(tradeOutBtn.classList.contains('selected')).toBe(true);

    tradeOutBtn.click();
    fixture.detectChanges();

    expect(tradeOutBtn.classList.contains('selected')).toBe(false);
  });

  it('should clear skipped state when adding a trade', () => {
    const skipBtn = el.querySelector('.trade-btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();

    expect(el.querySelector('.skip-message')).toBeTruthy();

    const addBtn = el.querySelector('.trade-btn--add') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    expect(el.querySelector('.skip-message')).toBeFalsy();
  });

  it('should load tradable cards on init', () => {
    expect(mockDomainService.getDomainCards).toHaveBeenCalledWith([1, 2], 0, 100, [1, 2, 3]);
  });

  it('should render trade row title with correct number', () => {
    const addBtn = el.querySelector('.trade-btn--add') as HTMLButtonElement;
    addBtn.click();
    addBtn.click();
    fixture.detectChanges();

    const titles = el.querySelectorAll('.trade-row__title');
    expect(titles[0]?.textContent).toContain('Trade 1');
    expect(titles[1]?.textContent).toContain('Trade 2');
  });
});
