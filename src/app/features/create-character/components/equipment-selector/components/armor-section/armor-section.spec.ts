import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ArmorSection } from './armor-section';
import { ArmorService } from '../../../../services/armor.service';
import { PaginatedCards } from '../../../../services/weapon.service';
import { CardData } from '../../../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildCardData(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Leather Armor',
    description: '',
    cardType: 'armor',
    tags: ['Score: 2', 'Major: 7+', 'Severe: 13+'],
    metadata: { baseScore: 2, baseMajorThreshold: 7, baseSevereThreshold: 13, tier: 1, modifiers: [] },
    ...overrides,
  };
}

function buildPaginatedCards(cards: CardData[] = []): PaginatedCards {
  return { cards, currentPage: 0, totalPages: 1, totalElements: cards.length };
}

describe('ArmorSection', () => {
  let fixture: ComponentFixture<ArmorSection>;
  let component: ArmorSection;
  let armorServiceMock: { getArmors: ReturnType<typeof vi.fn> };

  const armorCards = [
    buildCardData({ id: 1, name: 'Leather Armor' }),
    buildCardData({ id: 2, name: 'Chainmail' }),
  ];

  beforeEach(async () => {
    armorServiceMock = {
      getArmors: vi.fn().mockReturnValue(of(buildPaginatedCards(armorCards))),
    };

    await TestBed.configureTestingModule({
      imports: [ArmorSection],
      providers: [{ provide: ArmorService, useValue: armorServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ArmorSection);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load armor on init', () => {
    fixture.detectChanges();
    expect(armorServiceMock.getArmors).toHaveBeenCalledWith({ page: 0, tier: 1 });
    expect(component.armorCards()).toHaveLength(2);
  });

  it('should set error state on failed fetch', () => {
    armorServiceMock.getArmors.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('should select armor on card click', () => {
    fixture.detectChanges();
    component.onCardClicked(armorCards[0]);
    expect(component.selectedArmor()?.id).toBe(1);
  });

  it('should deselect armor when clicking same card', () => {
    fixture.detectChanges();
    component.onCardClicked(armorCards[0]);
    expect(component.selectedArmor()?.id).toBe(1);
    component.onCardClicked(armorCards[0]);
    expect(component.selectedArmor()).toBeNull();
  });

  it('should emit selection on card click', () => {
    fixture.detectChanges();
    let emitted: CardData | null | undefined;
    component.armorSelected.subscribe(v => (emitted = v));

    component.onCardClicked(armorCards[0]);
    expect(emitted?.id).toBe(1);
  });

  it('should load page on page changed', () => {
    fixture.detectChanges();
    armorServiceMock.getArmors.mockClear();
    component.onPageChanged(2);
    expect(armorServiceMock.getArmors).toHaveBeenCalledWith({ page: 2, tier: 1 });
  });
});
