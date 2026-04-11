import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';

import { DomainTradeStep, TradeRow } from './domain-trade-step';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { DomainCardTradeRequest, TradeDisplayPair } from '../../models/level-up-api.model';
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
      [newDomainCards]="newDomainCards()"
      [ownedDomainCardIds]="ownedDomainCardIds()"
      [targetLevel]="targetLevel()"
      [initialTradeRow]="initialTradeRow()"
      [initialSkipped]="initialSkipped()"
      (tradesChanged)="onTradesChanged($event)"
      (tradeDisplayChanged)="onTradeDisplayChanged($event)"
      (tradeRowChanged)="onTradeRowChanged($event)"
      (tradesSkippedChanged)="onTradesSkippedChanged($event)"
    />
  `,
  imports: [DomainTradeStep],
})
class TestHost {
  characterDomainCards = signal<DomainCardSummary[]>(MOCK_CHARACTER_CARDS);
  accessibleDomainIds = signal<number[]>([1, 2]);
  domainCardLevelCap = signal<number | null>(3);
  newDomainCards = signal<CardData[]>([]);
  ownedDomainCardIds = signal<number[]>([]);
  targetLevel = signal<number | null>(null);
  initialTradeRow = signal<TradeRow | null>(null);
  initialSkipped = signal(false);

  lastTrades: DomainCardTradeRequest[] | undefined;
  lastTradeDisplayPairs: TradeDisplayPair[] | undefined;
  lastTradeRow: TradeRow | null | undefined;
  lastSkipped: boolean | undefined;

  onTradesChanged(trades: DomainCardTradeRequest[]): void {
    this.lastTrades = trades;
  }

  onTradeDisplayChanged(pairs: TradeDisplayPair[]): void {
    this.lastTradeDisplayPairs = pairs;
  }

  onTradeRowChanged(row: TradeRow | null): void {
    this.lastTradeRow = row;
  }

  onTradesSkippedChanged(skipped: boolean): void {
    this.lastSkipped = skipped;
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

  it('should render trade row by default (not skipped)', () => {
    const row = el.querySelector('.trade-row');
    expect(row).toBeTruthy();
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

  it('should render character domain cards as trade-out buttons in trade row', () => {
    const tradeOutBtns = el.querySelectorAll('.trade-card-btn');
    expect(tradeOutBtns.length).toBe(3);
  });

  it('should toggle trade-out card selection', () => {
    const tradeOutBtn = el.querySelector('.trade-card-btn') as HTMLButtonElement;
    tradeOutBtn.click();
    fixture.detectChanges();

    expect(tradeOutBtn.classList.contains('selected')).toBe(true);

    tradeOutBtn.click();
    fixture.detectChanges();

    expect(tradeOutBtn.classList.contains('selected')).toBe(false);
  });

  it('should load tradable cards on init', () => {
    expect(mockDomainService.getDomainCards).toHaveBeenCalledWith([1, 2], 0, 100, [1, 2, 3]);
  });

  it('should emit tradeDisplayChanged with correct pairs', () => {
    const tradeOutBtn = el.querySelector('.trade-card-btn') as HTMLButtonElement;
    tradeOutBtn.click();
    fixture.detectChanges();

    expect(host.lastTradeDisplayPairs).toEqual([]);

    const cardGrid = el.querySelector('app-card-selection-grid');
    expect(cardGrid).toBeTruthy();
  });

  it('should filter out owned cards from tradable cards', () => {
    mockDomainService.getDomainCards.mockClear();
    mockDomainService.getDomainCards.mockReturnValue(of(MOCK_TRADABLE_CARDS));

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    host.ownedDomainCardIds.set([50]);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    const component = fixture.debugElement.children[0].componentInstance as DomainTradeStep;
    expect(component.tradableCards().length).toBe(1);
    expect(component.tradableCards()[0].name).toBe('Stone Wall');
  });

  it('should exclude newly selected domain cards from tradable cards', () => {
    const component = fixture.debugElement.children[0].componentInstance as DomainTradeStep;
    expect(component.filteredTradableCards().length).toBe(2);

    host.newDomainCards.set([{ id: 50, name: 'Lightning Bolt', description: 'Zap', cardType: 'domain' }]);
    fixture.detectChanges();

    expect(component.filteredTradableCards().length).toBe(1);
    expect(component.filteredTradableCards()[0].name).toBe('Stone Wall');
  });

  it('should emit a valid 1-for-1 trade when 1 trade-out and 1 replacement are selected (regression)', () => {
    // Select 1 card to give up
    const tradeOutBtn = el.querySelector('.trade-card-btn') as HTMLButtonElement;
    tradeOutBtn.click();
    fixture.detectChanges();

    expect(host.lastTrades).toEqual([]);

    // Click 1 replacement card in the CardSelectionGrid (maxSelections now === 1)
    const replacementCard = el.querySelector('app-card-selection-grid app-daggerheart-card .card') as HTMLElement;
    expect(replacementCard).toBeTruthy();
    replacementCard.click();
    fixture.detectChanges();

    expect(host.lastTrades).toHaveLength(1);
    expect(host.lastTrades?.[0].tradeOutCardIds).toEqual([1]);
    expect(host.lastTrades?.[0].tradeInCardIds).toHaveLength(1);
    expect(host.lastTradeDisplayPairs).toHaveLength(1);
    expect(host.lastTradeDisplayPairs?.[0].gaveUpName).toBe('Flame Strike');
  });

  it('should use minimum of domainCardLevelCap and targetLevel for loading', () => {
    mockDomainService.getDomainCards.mockClear();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    host.domainCardLevelCap.set(5);
    host.targetLevel.set(3);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    expect(mockDomainService.getDomainCards).toHaveBeenCalledWith([1, 2], 0, 100, [1, 2, 3]);
  });

  describe('rehydration from initialTradeRow', () => {
    it('rehydrates trade state from initialTradeRow on init', () => {
      const hydrated: TradeRow = {
        tradedOut: [MOCK_CHARACTER_CARDS[0]],
        tradedIn: [MOCK_TRADABLE_CARDS[0]],
        equipTradedIn: [],
      };
      const f2 = TestBed.createComponent(TestHost);
      f2.componentInstance.initialTradeRow.set(hydrated);
      f2.detectChanges();

      const component = f2.debugElement.children[0].componentInstance as DomainTradeStep;
      expect(component.trade().tradedOut).toHaveLength(1);
      expect(component.trade().tradedOut[0].id).toBe(1);
      expect(component.trade().tradedIn).toHaveLength(1);
      expect(component.trade().tradedIn[0].id).toBe(50);

      const tradeOutBtn = (f2.nativeElement as HTMLElement).querySelector('.trade-card-btn');
      expect(tradeOutBtn?.classList.contains('selected')).toBe(true);
    });

    it('rehydrates skipped state from initialSkipped on init', () => {
      const f2 = TestBed.createComponent(TestHost);
      f2.componentInstance.initialSkipped.set(true);
      f2.detectChanges();

      const skipMsg = (f2.nativeElement as HTMLElement).querySelector('.skip-message');
      expect(skipMsg?.textContent).toContain('No trades will be made');
    });

    it('prefers initialSkipped over initialTradeRow when both are set (skip wins)', () => {
      const hydrated: TradeRow = {
        tradedOut: [MOCK_CHARACTER_CARDS[0]],
        tradedIn: [],
        equipTradedIn: [],
      };
      const f2 = TestBed.createComponent(TestHost);
      f2.componentInstance.initialTradeRow.set(hydrated);
      f2.componentInstance.initialSkipped.set(true);
      f2.detectChanges();

      const component = f2.debugElement.children[0].componentInstance as DomainTradeStep;
      expect(component.skipped()).toBe(true);
      expect(component.trade().tradedOut).toHaveLength(0);
    });
  });

  describe('tradeRowChanged output', () => {
    it('emits tradeRowChanged whenever trade state mutates', () => {
      const tradeOutBtn = el.querySelector('.trade-card-btn') as HTMLButtonElement;
      tradeOutBtn.click();
      fixture.detectChanges();

      expect(host.lastTradeRow).not.toBeNull();
      expect(host.lastTradeRow?.tradedOut).toHaveLength(1);
      expect(host.lastTradeRow?.tradedOut[0].id).toBe(1);
    });

    it('emits tradeRowChanged(null) and tradesSkippedChanged(true) on skip', () => {
      const skipBtn = el.querySelector('.trade-btn--skip') as HTMLButtonElement;
      skipBtn.click();
      fixture.detectChanges();

      expect(host.lastTradeRow).toBeNull();
      expect(host.lastSkipped).toBe(true);
    });
  });
});
