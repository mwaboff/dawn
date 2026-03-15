import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';

import { DomainCardStep } from './domain-card-step';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { DomainCardSummary } from '../../../character-sheet/models/character-sheet-view.model';

const MOCK_DOMAIN_CARDS: CardData[] = [
  { id: 10, name: 'Flame Strike', description: 'Fire spell', cardType: 'domain' },
  { id: 11, name: 'Ice Shield', description: 'Ice defense', cardType: 'domain' },
  { id: 12, name: 'Shadow Step', description: 'Move through shadows', cardType: 'domain' },
];

const MOCK_DOMAIN_CARDS_WITH_LEVELS: CardData[] = [
  { id: 11, name: 'Ice Shield', description: 'Ice defense', cardType: 'domain', metadata: { level: 1 } },
  { id: 12, name: 'Shadow Step', description: 'Move through shadows', cardType: 'domain', metadata: { level: 1 } },
  { id: 13, name: 'Flame Burst', description: 'Fire burst', cardType: 'domain', metadata: { level: 2 } },
  { id: 14, name: 'Stone Wall', description: 'Earth defense', cardType: 'domain', metadata: { level: 3 } },
];

const MOCK_EQUIPPED: DomainCardSummary[] = [
  { id: 20, name: 'Healing Light', features: [], domainName: 'Grace', level: 1 },
  { id: 21, name: 'War Cry', features: [], domainName: 'Valor', level: 2 },
];

const mockDomainService = {
  getDomainCards: vi.fn().mockReturnValue(of(MOCK_DOMAIN_CARDS)),
};

@Component({
  template: `
    <app-domain-card-step
      [accessibleDomainIds]="accessibleDomainIds()"
      [domainCardLevelCap]="domainCardLevelCap()"
      [equippedDomainCardCount]="equippedDomainCardCount()"
      [maxEquippedDomainCards]="maxEquippedDomainCards()"
      [ownedDomainCardIds]="ownedDomainCardIds()"
      [equippedDomainCards]="equippedDomainCards()"
      [initialCard]="initialCard()"
      [initialEquip]="initialEquip()"
      [initialUnequipId]="initialUnequipId()"
      (domainCardSelected)="onCardSelected($event)"
      (equipChanged)="onEquipChanged($event)"
      (unequipCardIdChanged)="onUnequipChanged($event)"
    />
  `,
  imports: [DomainCardStep],
})
class TestHost {
  accessibleDomainIds = signal<number[]>([1, 2]);
  domainCardLevelCap = signal<number | null>(3);
  equippedDomainCardCount = signal(2);
  maxEquippedDomainCards = signal(3);
  ownedDomainCardIds = signal<number[]>([10]);
  equippedDomainCards = signal<DomainCardSummary[]>(MOCK_EQUIPPED);
  initialCard = signal<CardData | undefined>(undefined);
  initialEquip = signal(false);
  initialUnequipId = signal<number | undefined>(undefined);

  lastSelectedCard: CardData | undefined;
  lastEquipValue: boolean | undefined;
  lastUnequipId: number | undefined | null = null;

  onCardSelected(card: CardData): void { this.lastSelectedCard = card; }
  onEquipChanged(value: boolean): void { this.lastEquipValue = value; }
  onUnequipChanged(id: number | undefined): void { this.lastUnequipId = id; }
}

describe('DomainCardStep', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    mockDomainService.getDomainCards.mockClear();
    mockDomainService.getDomainCards.mockReturnValue(of(MOCK_DOMAIN_CARDS));

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
    expect(el.querySelector('app-domain-card-step')).toBeTruthy();
  });

  it('should load domain cards on init', () => {
    expect(mockDomainService.getDomainCards).toHaveBeenCalledWith([1, 2], 0, 100, [1, 2, 3]);
  });

  it('should filter out owned cards', () => {
    const cards = el.querySelectorAll('app-daggerheart-card');
    expect(cards.length).toBe(2);
  });

  it('should not load cards when accessibleDomainIds is empty', () => {
    mockDomainService.getDomainCards.mockClear();

    host.accessibleDomainIds.set([]);
    fixture.detectChanges();

    const freshFixture = TestBed.createComponent(TestHost);
    freshFixture.componentInstance.accessibleDomainIds.set([]);
    freshFixture.detectChanges();

    expect(mockDomainService.getDomainCards).not.toHaveBeenCalled();
  });

  it('should emit domainCardSelected when a card is clicked', () => {
    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    expect(host.lastSelectedCard).toBeTruthy();
  });

  it('should show equip section after card is selected', () => {
    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    const equipSection = el.querySelector('.equip-section');
    expect(equipSection).toBeTruthy();
  });

  it('should toggle equip and emit equipChanged', () => {
    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    const checkbox = el.querySelector('.equip-toggle input') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    expect(host.lastEquipValue).toBe(true);
  });

  it('should show unequip list when at max equipped and equip is toggled on', () => {
    host.equippedDomainCardCount.set(3);
    host.maxEquippedDomainCards.set(3);
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    const checkbox = el.querySelector('.equip-toggle input') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    const unequipSection = el.querySelector('.unequip-section');
    expect(unequipSection).toBeTruthy();

    const unequipCards = el.querySelectorAll('.unequip-card');
    expect(unequipCards.length).toBe(2);
  });

  it('should emit unequipCardIdChanged when unequip card is clicked', () => {
    host.equippedDomainCardCount.set(3);
    host.maxEquippedDomainCards.set(3);
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    const checkbox = el.querySelector('.equip-toggle input') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    const unequipBtn = el.querySelector('.unequip-card') as HTMLButtonElement;
    unequipBtn.click();
    fixture.detectChanges();

    expect(host.lastUnequipId).toBe(20);
  });

  it('should not show unequip section when under max equipped', () => {
    host.equippedDomainCardCount.set(1);
    host.maxEquippedDomainCards.set(3);
    fixture.detectChanges();

    const cardButton = el.querySelector('app-daggerheart-card .card') as HTMLElement;
    cardButton.click();
    fixture.detectChanges();

    const checkbox = el.querySelector('.equip-toggle input') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    expect(el.querySelector('.unequip-section')).toBeFalsy();
  });

  it('should pass null domainCardLevelCap without levels filter', () => {
    mockDomainService.getDomainCards.mockClear();
    mockDomainService.getDomainCards.mockReturnValue(of(MOCK_DOMAIN_CARDS));

    host.domainCardLevelCap.set(null);
    fixture.detectChanges();

    const freshFixture = TestBed.createComponent(TestHost);
    freshFixture.componentInstance.domainCardLevelCap.set(null);
    freshFixture.detectChanges();

    expect(mockDomainService.getDomainCards).toHaveBeenCalledWith([1, 2], 0, 100, undefined);
  });

  it('should render step instruction text', () => {
    const instruction = el.querySelector('.step-instruction');
    expect(instruction?.textContent).toContain('Choose a new domain card');
  });

  describe('level filter', () => {
    let levelFixture: ComponentFixture<TestHost>;
    let levelEl: HTMLElement;

    beforeEach(async () => {
      mockDomainService.getDomainCards.mockReturnValue(of(MOCK_DOMAIN_CARDS_WITH_LEVELS));

      levelFixture = TestBed.createComponent(TestHost);
      levelFixture.componentInstance.ownedDomainCardIds.set([]);
      levelFixture.detectChanges();
      levelEl = levelFixture.nativeElement as HTMLElement;
    });

    it('should show level filter pills when multiple levels exist', () => {
      const pills = levelEl.querySelectorAll('.level-pill');
      expect(pills.length).toBe(4);
      expect(pills[0].textContent?.trim()).toBe('All');
      expect(pills[1].textContent?.trim()).toBe('1');
      expect(pills[2].textContent?.trim()).toBe('2');
      expect(pills[3].textContent?.trim()).toBe('3');
    });

    it('should filter cards when a level pill is clicked', () => {
      const pills = levelEl.querySelectorAll('.level-pill');
      (pills[1] as HTMLElement).click();
      levelFixture.detectChanges();

      const cards = levelEl.querySelectorAll('app-daggerheart-card');
      expect(cards.length).toBe(2);
    });

    it('should reset filter when All pill is clicked', () => {
      const pills = levelEl.querySelectorAll('.level-pill');
      (pills[1] as HTMLElement).click();
      levelFixture.detectChanges();

      (pills[0] as HTMLElement).click();
      levelFixture.detectChanges();

      const cards = levelEl.querySelectorAll('app-daggerheart-card');
      expect(cards.length).toBe(4);
    });

    it('should not show level filter when only one level exists', () => {
      const singleLevelCards: CardData[] = [
        { id: 11, name: 'Card A', description: 'A', cardType: 'domain', metadata: { level: 1 } },
        { id: 12, name: 'Card B', description: 'B', cardType: 'domain', metadata: { level: 1 } },
      ];
      mockDomainService.getDomainCards.mockReturnValue(of(singleLevelCards));

      const singleFixture = TestBed.createComponent(TestHost);
      singleFixture.componentInstance.ownedDomainCardIds.set([]);
      singleFixture.detectChanges();

      const singleEl = singleFixture.nativeElement as HTMLElement;
      expect(singleEl.querySelector('.level-filter')).toBeFalsy();
    });

    it('should mark All pill as active by default', () => {
      const allPill = levelEl.querySelector('.level-pill');
      expect(allPill?.classList.contains('active')).toBe(true);
    });

    it('should mark selected level pill as active', () => {
      const pills = levelEl.querySelectorAll('.level-pill');
      (pills[2] as HTMLElement).click();
      levelFixture.detectChanges();

      expect(pills[2].classList.contains('active')).toBe(true);
      expect(pills[0].classList.contains('active')).toBe(false);
    });
  });
});
